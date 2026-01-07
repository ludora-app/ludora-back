import * as admin from 'firebase-admin';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Message, MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  constructor(
    private configService: ConfigService,
    private logger: PinoLogger,
  ) {
    this.logger.setContext(FirebaseService.name);
  }

  async onModuleInit() {
    try {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        }),
      });

      this.logger.info('Firebase app initialized');
    } catch (error) {
      this.logger.error(error, 'Error initializing Firebase app');
      throw error;
    }
  }

  /**
   * Send a notification to a single token
   */
  async sendToToken(token: string, payload: Message): Promise<string> {
    try {
      const response = await admin.messaging().send({
        token,
        ...payload,
      });

      this.logger.debug(`Notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(error, `Error sending notification to token ${token}`);
      throw error;
    }
  }

  /**
   * Send a notification to multiple tokens
   * @param tokens
   * @param payload
   * @returns
   */
  async sendToMultipleTokens(
    tokens: string[],
    payload: MulticastMessage,
  ): Promise<admin.messaging.BatchResponse> {
    if (tokens.length === 0) {
      this.logger.warn('⚠️ No tokens provided');
      return { failureCount: 0, responses: [], successCount: 0 };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...payload,
      });

      this.logger.debug(
        `Multicast sent: ${response.successCount} success, ${response.failureCount} failures`,
      );

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.logger.warn(`Failed to send to token ${tokens[idx]}: ${resp.error?.message}`);
        }
      });

      return response;
    } catch (error) {
      this.logger.error('Error sending multicast notification:', error);
      throw error;
    }
  }

  /**
   * Send a notification to a topic
   */
  async sendToTopic(topic: string, payload: Message): Promise<string> {
    try {
      const response = await admin.messaging().send({
        topic,
        ...payload,
      });

      this.logger.debug(`Notification sent to topic ${topic}: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Error sending to topic ${topic}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string,
  ): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.debug(`${response.successCount} tokens subscribed to topic ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Verify the validity of a token
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await admin.messaging().send(
        {
          data: { test: 'true' },
          token,
        },
        true,
      );
      return true;
    } catch (error) {
      this.logger.warn(`Invalid token: ${token}: ${error.message}`);
      return false;
    }
  }
}
