import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

class AddressDto {
  @ApiProperty({ type: String }) city: string;
  @ApiProperty({ type: String }) country: string;
  @ApiProperty({ type: String }) line1: string;
  @ApiProperty({ required: false, type: String }) line2?: string;
  @ApiProperty({ type: String }) postal_code: string;
  @ApiProperty({ required: false, type: String }) state?: string;
}

class VerificationDocumentDto {
  @ApiProperty({ required: false, type: String }) back?: string;
  @ApiProperty({ required: false, type: String }) front?: string;
  @ApiProperty({ required: false, type: String }) details?: string;
  @ApiProperty({ required: false, type: String }) details_code?: string;
}

class VerificationDto {
  @ApiProperty({ type: VerificationDocumentDto }) document: VerificationDocumentDto;
  @ApiProperty({ required: false, type: VerificationDocumentDto })
  additional_document?: VerificationDocumentDto;
  @ApiProperty({ required: false, type: String }) details?: string;
  @ApiProperty({ required: false, type: String }) details_code?: string;
  @ApiProperty({ required: false, type: String }) status?: string;
}

class RequirementsDto {
  @ApiProperty({ type: [String] }) alternatives: string[];
  @ApiProperty({ required: false, type: Number }) current_deadline?: number;
  @ApiProperty({ type: [String] }) currently_due: string[];
  @ApiProperty({ required: false, type: String }) disabled_reason?: string;
  @ApiProperty({ type: [String] }) errors: string[];
  @ApiProperty({ type: [String] }) eventually_due: string[];
  @ApiProperty({ type: [String] }) past_due: string[];
  @ApiProperty({ type: [String] }) pending_verification: string[];
}

class RelationshipDto {
  @ApiProperty({ type: Boolean }) authorizer: boolean;
  @ApiProperty({ type: Boolean }) director: boolean;
  @ApiProperty({ type: Boolean }) executive: boolean;
  @ApiProperty({ type: Boolean }) legal_guardian: boolean;
  @ApiProperty({ type: Boolean }) owner: boolean;
  @ApiProperty({ required: false, type: Number }) percent_ownership?: number;
  @ApiProperty({ type: Boolean }) representative: boolean;
  @ApiProperty({ required: false, type: String }) title?: string;
}

class DateOfBirthDto {
  @ApiProperty({ type: Number }) day: number;
  @ApiProperty({ type: Number }) month: number;
  @ApiProperty({ type: Number }) year: number;
}

class IndividualDto {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ type: String }) object: string;
  @ApiProperty({ type: String }) account: string;
  @ApiProperty({ type: AddressDto }) address: AddressDto;
  @ApiProperty({ type: Number }) created: number;
  @ApiProperty({ type: DateOfBirthDto }) dob: DateOfBirthDto;
  @ApiProperty({ type: String }) email: string;
  @ApiProperty({ type: String }) first_name: string;
  @ApiProperty({ type: String }) last_name: string;
  @ApiProperty({ type: RequirementsDto }) future_requirements: RequirementsDto;
  @ApiProperty({ type: Object }) metadata: object;
  @ApiProperty({ type: String }) phone: string;
  @ApiProperty({ type: RelationshipDto }) relationship: RelationshipDto;
  @ApiProperty({ type: RequirementsDto }) requirements: RequirementsDto;
  @ApiProperty({ type: VerificationDto }) verification: VerificationDto;
}

class BusinessProfileDto {
  @ApiProperty({ required: false, type: Number }) annual_revenue?: number;
  @ApiProperty({ required: false, type: Number }) estimated_worker_count?: number;
  @ApiProperty({ type: String }) mcc: string;
  @ApiProperty({ required: false, type: String }) name?: string;
  @ApiProperty({ type: String }) product_description: string;
  @ApiProperty({ required: false, type: String }) support_address?: string;
  @ApiProperty({ required: false, type: String }) support_email?: string;
  @ApiProperty({ required: false, type: String }) support_phone?: string;
  @ApiProperty({ required: false, type: String }) support_url?: string;
  @ApiProperty({ required: false, type: String }) url?: string;
}

class CompanyDto {
  @ApiProperty({ type: AddressDto }) address: AddressDto;
  @ApiProperty({ type: Boolean }) directors_provided: boolean;
  @ApiProperty({ type: Boolean }) executives_provided: boolean;
  @ApiProperty({ required: false, type: String }) name?: string;
  @ApiProperty({ type: Boolean }) owners_provided: boolean;
  @ApiProperty({ type: String }) phone: string;
  @ApiProperty({ type: Boolean }) taxId_provided: boolean;
  @ApiProperty({ type: VerificationDto }) verification: VerificationDto;
}

class CapabilitiesDto {
  @ApiProperty({ type: String }) card_payments: string;
  @ApiProperty({ type: String }) transfers: string;
}

class ExternalAccountsDto {
  @ApiProperty({ type: String }) object: string;
  @ApiProperty({ type: [Object] }) data: object[];
  @ApiProperty({ type: Boolean }) has_more: boolean;
  @ApiProperty({ type: Number }) total_count: number;
  @ApiProperty({ type: String }) url: string;
}

class ControllerFeesDto {
  @ApiProperty({ type: String }) payer: string;
}

class ControllerLossesDto {
  @ApiProperty({ type: String }) payments: string;
}

class StripeDashboardDto {
  @ApiProperty({ type: String }) type: string;
}

class ControllerDto {
  @ApiProperty({ type: ControllerFeesDto }) fees: ControllerFeesDto;
  @ApiProperty({ type: Boolean }) is_controller: boolean;
  @ApiProperty({ type: ControllerLossesDto }) losses: ControllerLossesDto;
  @ApiProperty({ type: String }) requirement_collection: string;
  @ApiProperty({ type: StripeDashboardDto }) stripe_dashboard: StripeDashboardDto;
  @ApiProperty({ type: String }) type: string;
}

class BacsDebitPaymentsDto {
  @ApiProperty({ nullable: true, required: false, type: String }) display_name?: string;
  @ApiProperty({ nullable: true, required: false, type: String }) service_user_number?: string;
}

class BrandingDto {
  @ApiProperty({ nullable: true, required: false, type: String }) icon?: string;
  @ApiProperty({ nullable: true, required: false, type: String }) logo?: string;
  @ApiProperty({ nullable: true, required: false, type: String }) primary_color?: string;
  @ApiProperty({ nullable: true, required: false, type: String }) secondary_color?: string;
}

class CardIssuingTosAcceptanceDto {
  @ApiProperty({ nullable: true, required: false, type: Number }) date?: number;
  @ApiProperty({ nullable: true, required: false, type: String }) ip?: string;
}

class CardIssuingDto {
  @ApiProperty({ type: CardIssuingTosAcceptanceDto }) tos_acceptance: CardIssuingTosAcceptanceDto;
}

class DeclineOnDto {
  @ApiProperty({ type: Boolean }) avs_failure: boolean;
  @ApiProperty({ type: Boolean }) cvc_failure: boolean;
}

class CardPaymentsSettingsDto {
  @ApiProperty({ type: DeclineOnDto }) decline_on: DeclineOnDto;
  @ApiProperty({ type: String }) statement_descriptor_prefix: string;
  @ApiProperty({ nullable: true, required: false, type: String })
  statement_descriptor_prefix_kana?: string;
  @ApiProperty({ nullable: true, required: false, type: String })
  statement_descriptor_prefix_kanji?: string;
}

class DashboardSettingsDto {
  @ApiProperty({ nullable: true, required: false, type: String })
  display_name?: string;
  @ApiProperty({ type: String }) timezone: string;
}

class InvoicesSettingsDto {
  @ApiProperty({ nullable: true, required: false, type: String })
  default_account_taxIds?: string;
  @ApiProperty({ type: Boolean }) hosted_payment_method_save: boolean;
}

class PaymentsSettingsDto {
  @ApiProperty({ type: String }) statement_descriptor: string;
  @ApiProperty({ nullable: true, required: false, type: String })
  statement_descriptor_kana?: string;
  @ApiProperty({ nullable: true, required: false, type: String })
  statement_descriptor_kanji?: string;
}

class PayoutsScheduleDto {
  @ApiProperty({ type: Number }) delay_days: number;
  @ApiProperty({ type: String }) interval: string;
}

class PayoutsSettingsDto {
  @ApiProperty({ type: Boolean }) debit_negative_balances: boolean;
  @ApiProperty({ type: PayoutsScheduleDto }) schedule: PayoutsScheduleDto;
  @ApiProperty({ nullable: true, required: false, type: String })
  statement_descriptor?: string;
}

class SettingsDto {
  @ApiProperty({ type: BacsDebitPaymentsDto }) bacs_debit_payments: BacsDebitPaymentsDto;
  @ApiProperty({ type: BrandingDto }) branding: BrandingDto;
  @ApiProperty({ type: CardIssuingDto }) card_issuing: CardIssuingDto;
  @ApiProperty({ type: CardPaymentsSettingsDto }) card_payments: CardPaymentsSettingsDto;
  @ApiProperty({ type: DashboardSettingsDto }) dashboard: DashboardSettingsDto;
  @ApiProperty({ type: InvoicesSettingsDto }) invoices: InvoicesSettingsDto;
  @ApiProperty({ type: PaymentsSettingsDto }) payments: PaymentsSettingsDto;
  @ApiProperty({ type: PayoutsSettingsDto }) payouts: PayoutsSettingsDto;
  @ApiProperty({ type: Object }) sepa_debit_payments: object;
}

class TosAcceptanceDto {
  @ApiProperty({ type: Number }) date: number;
  @ApiProperty({ type: String }) ip: string;
  @ApiProperty({ type: String }) user_agent: string;
}

export class StripeAccountResponseDataDto {
  @ApiProperty({ type: String }) id: string;
  @ApiProperty({ type: String }) object: string;
  @ApiProperty({ type: BusinessProfileDto }) business_profile: BusinessProfileDto;
  @ApiProperty({ type: String }) business_type: string;
  @ApiProperty({ type: CapabilitiesDto }) capabilities: CapabilitiesDto;
  @ApiProperty({ type: Boolean }) charges_enabled: boolean;
  @ApiProperty({ type: CompanyDto }) company: CompanyDto;
  @ApiProperty({ type: ControllerDto }) controller: ControllerDto;
  @ApiProperty({ type: String }) country: string;
  @ApiProperty({ type: Number }) created: number;
  @ApiProperty({ type: String }) default_currency: string;
  @ApiProperty({ type: Boolean }) details_submitted: boolean;
  @ApiProperty({ type: String }) email: string;
  @ApiProperty({ type: ExternalAccountsDto }) external_accounts: ExternalAccountsDto;
  @ApiProperty({ type: RequirementsDto }) future_requirements: RequirementsDto;
  @ApiProperty({ type: IndividualDto }) individual: IndividualDto;
  @ApiProperty({ type: Object }) metadata: object;
  @ApiProperty({ type: Boolean }) payouts_enabled: boolean;
  @ApiProperty({ type: RequirementsDto }) requirements: RequirementsDto;
  @ApiProperty({ type: SettingsDto }) settings: SettingsDto;
  @ApiProperty({ type: TosAcceptanceDto }) tos_acceptance: TosAcceptanceDto;
  @ApiProperty({ type: String }) type: string;
}

export class StripeAccountResponseDto extends ResponseTypeDto<StripeAccountResponseDataDto> {
  @ApiProperty({ type: StripeAccountResponseDataDto })
  data: StripeAccountResponseDataDto;
}
