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
  Req,
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
import { FastifyRequest } from 'fastify';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { SWAGGER_TAG_NOTIFICATIONS } from 'src/swagger.config';
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
    @Req() req: FastifyRequest,
    @Query() filters: NotificationFilterDto,
  ): Promise<PaginationResponseTypeDto<NotificationResponseData>> {
    const userUid = req['user'].uid;
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
    @Req() req: FastifyRequest,
    @Query() filters: NotificationFilterDto,
  ): Promise<UnreadCountResponseDto> {
    const userUid = req['user'].uid;
    const data = await this.notificationsService.getUnreadCount(userUid, filters);
    return { data, message: 'Unread count fetched successfully' };
  }

  @Patch(':uid/read')
  @Protected()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiNoContentResponse({ description: 'Notification marked as read' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async markAsRead(@Req() req, @Param('uid') uid: string) {
    const userUid = req['user'].uid;
    return this.notificationsService.markAsRead(uid, userUid);
  }

  @Patch('read-all')
  @Protected()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiNoContentResponse({ description: 'All notifications marked as read' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@Req() req) {
    const userUid = req['user'].uid;
    await this.notificationsService.markAllAsRead(userUid);
    return;
  }

  @Delete(':uid')
  @Protected()
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiNoContentResponse({ description: 'Notification deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Req() req, @Param('uid') uid: string) {
    const userUid = req['user'].uid;
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
