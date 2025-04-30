import { supabase } from './supabase';

interface QueryOptions {
  select?: string;
  filterColumn?: string;
  filterValue?: any;
  orderColumn?: string;
  ascending?: boolean;
  start?: number;
  end?: number;
  limit?: number;
}

/**
 * Perform a query on a Supabase table with flexible options
 */
export async function querySupabase(table: string, options: QueryOptions = {}) {
  try {
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters if provided
    if (options.filterColumn && options.filterValue !== undefined) {
      query = query.eq(options.filterColumn, options.filterValue);
    }
    
    // Apply ordering if provided
    if (options.orderColumn) {
      query = query.order(options.orderColumn, { 
        ascending: options.ascending ?? false 
      });
    }
    
    // Apply pagination if provided
    if (options.limit) {
      query = query.limit(options.limit);
    } else if (options.start !== undefined && options.end !== undefined) {
      query = query.range(options.start, options.end);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase query error:', error);
    return null;
  }
}

/**
 * Insert data into a Supabase table
 */
export async function insertSupabase(table: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
      
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Supabase insert error:', error);
    return null;
  }
}

/**
 * Update data in a Supabase table
 */
export async function updateSupabase(table: string, id: number, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Supabase update error:', error);
    return null;
  }
}

/**
 * Delete data from a Supabase table
 */
export async function deleteSupabase(table: string, id: number) {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase delete error:', error);
    return false;
  }
} 