import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { SWAGGER_TAG_NOTIFICATIONS } from 'src/swagger/swagger.config';
import { NotificationFilterDto } from './dto/input/notification-filter.dto';
import {
  FriendAcceptedData,
  FriendRequestData,
  SessionInvitationData,
  SessionUpdatedData,
} from './dto/input/notification-metadata.dto';
import { SendPushNotificationDto } from './dto/input/send-push-notification.dto';
import {
  NotificationResponseData,
  PaginatedNotificationResponse,
} from './dto/output/notification-response.dto';
import { UnreadCountResponseDto } from './dto/output/unread-count-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags(SWAGGER_TAG_NOTIFICATIONS)
@UseGuards(AuthB2CGuard)
@Controller('notifications')
@ApiExtraModels(FriendRequestData, SessionInvitationData, SessionUpdatedData, FriendAcceptedData)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('/collection')
  @Protected()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiOkResponse({
    description: 'Successfully fetched notifications',
    type: PaginatedNotificationResponse,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async findAll(
    @CurrentUser('uid') userUid: string,
    @Query() filters: NotificationFilterDto,
  ): Promise<PaginationResponseTypeDto<NotificationResponseData>> {
    const notifications = await this.notificationsService.findAllByUserUid(userUid, filters);
    return {
      data: notifications,
      message: 'Notifications fetched successfully',
    };
  }

  @Get('unread-count')
  @Protected()
  @ApiOperation({ summary: 'Get the unread count for the current user' })
  @ApiOkResponse({
    description: 'Successfully fetched unread count',
    type: UnreadCountResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async getUnreadCount(
    @CurrentUser('uid') userUid: string,
    @Query() filters: NotificationFilterDto,
  ): Promise<UnreadCountResponseDto> {
    const data = await this.notificationsService.getUnreadCount(userUid, filters);
    return { data, message: 'Unread count fetched successfully' };
  }

  @Patch(':uid/read')
  @Protected()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiNoContentResponse({ description: 'Notification marked as read' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async markAsRead(@CurrentUser('uid') userUid: string, @Param('uid') uid: string) {
    return this.notificationsService.markAsRead(uid, userUid);
  }

  @Patch('read-all')
  @Protected()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiNoContentResponse({ description: 'All notifications marked as read' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@CurrentUser('uid') userUid: string) {
    await this.notificationsService.markAllAsRead(userUid);
    return;
  }

  @Delete(':uid')
  @Protected()
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiNoContentResponse({ description: 'Notification deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@CurrentUser('uid') userUid: string, @Param('uid') uid: string) {
    await this.notificationsService.delete(uid, userUid);
    return;
  }

  @Post('send-push')
  @ApiExcludeEndpoint()
  @UseGuards(DevOnlyGuard)
  @Protected()
  @ApiOperation({ summary: '[DEV ONLY] Send a push notification to a specific FCM token' })
  @ApiOkResponse({
    description: 'Push notification sent successfully',
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async sendPushNotification(@Body() dto: SendPushNotificationDto) {
    await this.notificationsService.sendPushNotificationByToken(dto);
    return {
      message: 'Push notification sent successfully',
      success: true,
    };
  }
}
