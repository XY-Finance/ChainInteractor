/**
 * Utility functions for handling Solidity type checking
 */

/**
 * Checks if a type is a structured type (array or tuple)
 * @param type - The Solidity type string
 * @returns true if the type is array or tuple, false otherwise
 */
export const isStructuredType = (type: string): boolean => type === 'array' || type === 'tuple'

/**
 * Checks if a type is an array type
 * @param type - The Solidity type string
 * @returns true if the type is array, false otherwise
 */
export const isArrayType = (type: string): boolean => type === 'array'

/**
 * Checks if a type is a tuple type
 * @param type - The Solidity type string
 * @returns true if the type is tuple, false otherwise
 */
export const isTupleType = (type: string): boolean => type === 'tuple'
