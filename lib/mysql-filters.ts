import { executeQuery } from './db';

/**
 * Convert DynamoDB-style filter expressions to MySQL query parts
 */
export function buildSqlFilterFromParams({
  searchTerm = '',
  minYear = '',
  maxYear = '',
  minMileage = '',
  maxMileage = '',
  minPrice = '',
  maxPrice = '',
  makes = '',
  states = ''
}: {
  searchTerm?: string,
  minYear?: string,
  maxYear?: string,
  minMileage?: string,
  maxMileage?: string,
  minPrice?: string,
  maxPrice?: string,
  makes?: string,
  states?: string
}) {
  const whereConditions: string[] = [];
  const values: any[] = [];
  
  // Parse the makes and states arrays
  const selectedMakes = makes ? JSON.parse(makes) : [];
  const selectedStates = states ? JSON.parse(states) : [];
  
  // Search term filter (search in manufacturer, model, and description)
  if (searchTerm) {
    whereConditions.push("(manufacturer LIKE ? OR model LIKE ? OR description LIKE ?)");
    values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }
  
  // Year range filter
  if (minYear) {
    whereConditions.push("year_clean >= ?");
    values.push(Number(minYear));
  }
  
  if (maxYear) {
    whereConditions.push("year_clean <= ?");
    values.push(Number(maxYear));
  }
  
  // Mileage range filter
  if (minMileage) {
    whereConditions.push("mileage_clean >= ?");
    values.push(Number(minMileage));
  }
  
  if (maxMileage) {
    whereConditions.push("mileage_clean <= ?");
    values.push(Number(maxMileage));
  }
  
  // Price range filter
  if (minPrice) {
    whereConditions.push("price_clean >= ?");
    values.push(Number(minPrice));
  }
  
  if (maxPrice) {
    whereConditions.push("price_clean <= ?");
    values.push(Number(maxPrice));
  }
  
  // Makes filter
  if (selectedMakes.length > 0) {
    const placeholders = selectedMakes.map(() => '?').join(', ');
    whereConditions.push(`manufacturer IN (${placeholders})`);
    values.push(...selectedMakes);
  }
  
  // State filter
  if (selectedStates.length > 0) {
    const placeholders = selectedStates.map(() => '?').join(', ');
    whereConditions.push(`state IN (${placeholders})`);
    values.push(...selectedStates);
  }
  
  return {
    whereClause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
    values
  };
}

/**
 * Convert the more complex trucks POST filter object to SQL parts
 */
export function buildSqlFilterFromJsonBody(filters: any) {
  const whereConditions: string[] = [];
  const values: any[] = [];
  
  // Makes filter
  if (filters.makes && filters.makes.length > 0) {
    const placeholders = filters.makes.map(() => '?').join(', ');
    whereConditions.push(`manufacturer IN (${placeholders})`);
    values.push(...filters.makes);
  }
  
  // States filter
  if (filters.states && filters.states.length > 0) {
    const placeholders = filters.states.map(() => '?').join(', ');
    whereConditions.push(`state IN (${placeholders})`);
    values.push(...filters.states);
  }
  
  // Models filter
  if (filters.models && filters.models.length > 0) {
    const placeholders = filters.models.map(() => '?').join(', ');
    whereConditions.push(`model IN (${placeholders})`);
    values.push(...filters.models);
  }
  
  // Year range filter
  if (filters.yearRange) {
    if (filters.yearRange.min !== undefined) {
      whereConditions.push("year_clean >= ?");
      values.push(Number(filters.yearRange.min));
    }
    if (filters.yearRange.max !== undefined) {
      whereConditions.push("year_clean <= ?");
      values.push(Number(filters.yearRange.max));
    }
  }
  
  // Mileage range filter
  if (filters.mileageRange) {
    if (filters.mileageRange.min !== undefined) {
      whereConditions.push("mileage >= ?");
      values.push(Number(filters.mileageRange.min));
    }
    if (filters.mileageRange.max !== undefined) {
      whereConditions.push("mileage <= ?");
      values.push(Number(filters.mileageRange.max));
    }
  }
  
  // Price range filter
  if (filters.priceRange) {
    if (filters.priceRange.min !== undefined) {
      whereConditions.push("price >= ?");
      values.push(Number(filters.priceRange.min));
    }
    if (filters.priceRange.max !== undefined) {
      whereConditions.push("price <= ?");
      values.push(Number(filters.priceRange.max));
    }
  }
  
  // Search term filter (search in multiple fields)
  if (filters.searchTerm) {
    whereConditions.push("(manufacturer LIKE ? OR model LIKE ? OR description LIKE ?)");
    values.push(
      `%${filters.searchTerm}%`, 
      `%${filters.searchTerm}%`, 
      `%${filters.searchTerm}%`
    );
  }
  
  // Year filter with delta (from VIN search)
  if (filters.year && typeof filters.year.value === 'number' && typeof filters.year.delta === 'number') {
    const minYear = filters.year.value - filters.year.delta;
    const maxYear = filters.year.value + filters.year.delta;
    whereConditions.push("year_clean BETWEEN ? AND ?");
    values.push(minYear, maxYear);
  }
  
  // Miles/mileage filter with delta (from VIN search)
  if (filters.miles && typeof filters.miles.value === 'number' && typeof filters.miles.delta === 'number') {
    const minMiles = filters.miles.value - filters.miles.delta;
    const maxMiles = filters.miles.value + filters.miles.delta;
    whereConditions.push("mileage_clean BETWEEN ? AND ?");
    values.push(minMiles, maxMiles);
  }
  
  return {
    whereClause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
    values
  };
}

/**
 * Execute a paginated trucks query with the given filters
 */
export async function queryTrucksWithFilters(filters: any, page = 1, limit = 20) {
  if (!process.env.TRUCK_TABLE_NAME) {
    throw new Error('TRUCK_TABLE_NAME environment variable is not set');
  }
  
  // Log table information for debugging
  console.log('In queryTrucksWithFilters - Using table:', process.env.TRUCK_TABLE_NAME);
  
  try {
    const tableName = process.env.TRUCK_TABLE_NAME;
    const { whereClause, values } = buildSqlFilterFromJsonBody(filters);
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
    console.log("Count query:", countQuery);
    console.log("With values:", values);
    
    const countResult = await executeQuery<any[]>({ query: countQuery, values });
    const total = countResult[0]?.total || 0;
    
    // Get paginated results
    const query = `
      SELECT * FROM ${tableName} 
      ${whereClause} 
      LIMIT ? OFFSET ?
    `;
    
    console.log("Data query:", query);
    console.log("With values:", [...values, limit, offset]);
    
    const results = await executeQuery<any[]>({ 
      query, 
      values: [...values, limit, offset] 
    });
    
    return {
      trucks: results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error("Error in queryTrucksWithFilters:", error);
    throw error;
  }
}

/**
 * Count trucks with the given filters
 */
export async function countTrucksWithFilters(filters: any) {
  if (!process.env.TRUCK_TABLE_NAME) {
    throw new Error('TRUCK_TABLE_NAME environment variable is not set');
  }
  
  // Log table information for debugging
  console.log('In countTrucksWithFilters - Using table:', process.env.TRUCK_TABLE_NAME);
  
  try {
    const tableName = process.env.TRUCK_TABLE_NAME;
    const { whereClause, values } = buildSqlFilterFromJsonBody(filters);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
    console.log("Count query:", countQuery);
    console.log("With values:", values);
    
    const countResult = await executeQuery<any[]>({ query: countQuery, values });
    
    return {
      count: countResult[0]?.total || 0
    };
  } catch (error) {
    console.error("Error in countTrucksWithFilters:", error);
    throw error;
  }
} 