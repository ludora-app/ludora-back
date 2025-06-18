import { User } from 'src/users/domain/entities/user';
import { PaginationResponseType } from 'src/interfaces/pagination-response-type';

import { UserFilter } from '../../application/queries/user-filter';
// import { UserFilterDto } from 'src/users/presentation/dtos/input/user-filter.dto';
// import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';

export abstract class UsersRepository {
  abstract save(user: User): Promise<User>;
  abstract findById(id: string): Promise<User>;
  // // todo : make the parameters optional
  abstract update(id: string, user: User): Promise<void>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(filters: UserFilter): Promise<PaginationResponseType<User>>;
}
