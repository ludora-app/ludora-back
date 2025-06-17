import { PartialType } from '@nestjs/mapped-types';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

import { UserDto } from '../user.dto';

/**
 * Data Transfer Object (DTO) representing a simplified user object
 * used in paginated list responses.
 *
 * This class partially extends the `UserDto`, keeping only the fields
 * necessary for listing users in the API response.
 *
 * Used typically in endpoints such as `GET /users/all` to return
 * lightweight user data.
 *
 * @property {string} id - Unique identifier of the user.
 * @property {string} [firstname] - First name of the user (optional).
 * @property {string} [lastname] - Last name of the user (optional).
 * @property {string} [name] - Full name (computed on the server, optional).
 * @property {string} [imageUrl] - Profile image URL of the user (optional).
 */
export class FindAllUsersResponseDataDto extends PartialType(UserDto) {
  readonly id: string;
  readonly firstname?: string;
  readonly lastname?: string;
  readonly name?: string;
  readonly imageUrl?: string;
}

/**
 * Paginated response DTO that wraps an array of simplified users,
 * along with pagination metadata and optional response metadata (message, status).
 *
 * This class is dynamically generated using the `PaginationResponseDto()` helper,
 * and is returned from the `GET /users/all` endpoint.
 *
 * Swagger decorators like `@ApiOkResponse({ type: FindAllUsersResponseDto })`
 * use this to generate accurate API docs.
 *
 * @example
 * {
 *   message: "Successfully fetched users",
 *   status: 200,
 *   data: {
 *     items: [
 *       { id: "uuid", firstname: "Jane", lastname: "Doe", imageUrl: "http://..." },
 *       ...
 *     ],
 *     nextCursor: "abc123",
 *     totalCount: 50
 *   }
 * }
 */
export const FindAllUsersResponseDto = PaginationResponseDto(FindAllUsersResponseDataDto);

/**
 * Type alias for the runtime instance type of `FindAllUsersResponseDto`.
 *
 * Useful when explicitly typing return values in services or controllers.
 */
export type FindAllUsersResponseDtoType = InstanceType<typeof FindAllUsersResponseDto>;
