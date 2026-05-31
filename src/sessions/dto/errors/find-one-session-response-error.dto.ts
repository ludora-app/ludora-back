import { createEnumErrorDto } from "src/shared/dto/errors/enum-error.dto";

export enum FindOneSessionResponseErrorTypes {
	SESSION_NOT_FOUND = "BRUH",
	BRUH = "BRUH",
}
export enum FindOneSessionResponseBadRequestErrorTypes {
	BRUH = "BRUH",
	OOF = "OOF",
	ARF = "ARF",
}
export const FindOneSessionResponseErrorDto = createEnumErrorDto(
	"FindOneSessionResponseErrorDto",
	FindOneSessionResponseErrorTypes,
);

export const FindOneSessionResponseBadRequestErrorDto = createEnumErrorDto(
	"FindOneSessionResponseBadRequestErrorDto",
	FindOneSessionResponseBadRequestErrorTypes,
);
