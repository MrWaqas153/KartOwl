import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchDto {
  @IsString()
  @IsNotEmpty({ message: 'Search query is required' })
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  @Transform(({ value }) => sanitizeInput(value))
  q: string;
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return (
    input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script-related content
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      // Remove special characters that could be used for injection
      .replace(/[<>"'`;(){}[\]]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
  );
}
