import { inject, Injectable, OnDestroy, EventEmitter } from '@angular/core';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { Message } from '../../shared/models/message.class';
import { BehaviorSubject } from 'rxjs';
import { UsersService } from './user.service';
import { User } from '../../shared/models/user.class';
import { ChannelService } from './channel.service';

@Injectable({
  providedIn: 'root',
})
/**
 * NavigationService class provides methods and properties for managing navigation within the application.
 */
export class NavigationService {
  /**
   * Emits an event when navigation is complete.
   */
  public navigationComplete = new EventEmitter<void>();

  private navigationCompleteSubject = new BehaviorSubject<void>(undefined);
  public navigationComplete$ = this.navigationCompleteSubject.asObservable();

  /**
   * The user service for handling user-related operations.
   */
  private userService: UsersService = inject(UsersService);

  private channelService: ChannelService = inject(ChannelService);

  /**
   * Observable that emits whenever a change occurs.
   */
  private changeSubject = new BehaviorSubject<string>('');
  public change$ = this.changeSubject.asObservable();

  /**
   * For chatview.
   * The main message list object and the path to its messages.
   */
  private _chatViewObject: Channel | Chat | undefined;
  get chatViewObject(): Channel | Chat {
    if (this._chatViewObject === undefined)
      return this.channelService.defaultChannel;
    else return this._chatViewObject;
  }
  private _chatViewPath: string | undefined;
  get chatViewPath(): string | undefined {
    return this._chatViewPath;
  }

  /**
   * For the threadview.
   * The path for message answers and the message object.
   */
  private _threadViewObject: Message | undefined;
  get threadViewObject(): Message | undefined {
    return this._threadViewObject;
  }

  private _threadViewPath: string | undefined;
  get threadViewPath(): string | undefined {
    return this._threadViewPath;
  }

  /**
   * Sets the main message object and updates the main message list path.
   * To executed from WorkspacemenuComponent.
   *
   * @param object - The object to set as the main message object.
   * @returns void
   */
  async setChatViewObject(object: Channel | User): Promise<void> {
    if (object instanceof Channel) {
      this._chatViewObject = object;
      this._chatViewPath =
        object.channelMessagesPath == ''
          ? undefined
          : object.channelMessagesPath;
    } else {
      const chat = await this.channelService.getChatWithUserByID(object.id);
      if (chat) {
        this._chatViewObject = chat;
        this._chatViewPath = chat.chatMessagesPath;
      }
    }
    this.clearThread();
    this.changeSubject.next('chatViewObjectSet');

    await new Promise((resolve) => setTimeout(resolve, 100));
    this.navigationCompleteSubject.next();
    if (
      this._chatViewObject === object ||
      (this._chatViewObject instanceof Chat && object instanceof User)
    ) {
      this.navigationComplete.emit();
    }
  }

  /**
   * Checks if the main message object is an instance of the Channel class.
   * @returns {boolean} True if the main message object is a Channel, false otherwise.
   */
  ifMainMessageObjectIsChannel(): boolean {
    return this._chatViewObject instanceof Channel;
  }

  /**
   * Checks if the main message object is of type Chat.
   *
   * @returns {boolean} True if the main message object is of type Chat, false otherwise.
   */
  ifMainMessageObjectIsChat(): boolean {
    return this._chatViewObject instanceof Chat;
  }

  /**
   * Sets the thread message path and updates the current message.
   *
   * @param message - The message object containing the answer path.
   * @returns void
   */
  setThreadViewObject(message: Message): void {
    this._threadViewPath = message.answerPath;
    this._threadViewObject = message;
    this.changeSubject.next('message');
  }

  /**
   * Clears the thread by resetting the messageAnswersPath and message properties.
   */
  private clearThread(): void {
    this._threadViewPath = undefined;
    this._threadViewObject = undefined;
  }

  // ############################################################################################################
  // methodes for search-functionality
  // ############################################################################################################

  /**
   * Gets the search context based on the current chat view object.
   *
   * If the chat view object is an instance of `Chat`:
   * - If there is a chat partner, returns `in:@{chatPartner}`.
   * - If it's a self-chat, returns `in:@{currentUser.name}`.
   *
   * If the chat view object is an instance of `Channel`, returns `in:#${channel.name}`.
   *
   * @returns The search context string, or an empty string if the chat view object is not a `Chat` or `Channel`.
   */
  getSearchContext(): string {
    if (this.chatViewObject instanceof Chat) {
      const chatPartner = this.getChatPartnerName();

      if (chatPartner) {
        return `in:@${chatPartner}`;
      } else if (this.isSelfChat()) {
        return `in:@${this.userService.currentUser?.name}`;
      }
    } else if (this.chatViewObject instanceof Channel) {
      return `in:#${this.chatViewObject.name}`;
    }
    return '';
  }

  /**
   * Checks if the current chat view object represents a self-chat (a chat with only the current user).
   *
   * @returns {boolean} `true` if the current chat view object is a `Chat` instance and all member IDs match the current user's ID, `false` otherwise.
   */
  private isSelfChat(): boolean {
    if (this.chatViewObject instanceof Chat && this.userService.currentUser) {
      return this.chatViewObject.memberIDs.every(
        (id) => id === this.userService.currentUser?.id
      );
    }
    return false;
  }

  /**
   * Gets the name of the chat partner for the current chat view object.
   *
   * @returns The name of the chat partner, or `undefined` if the current chat view object is not a `Chat` instance or if the current user is the only member of the chat.
   */
  private getChatPartnerName(): string | undefined {
    if (this.chatViewObject instanceof Chat) {
      const chatPartnerID = this.chatViewObject.memberIDs.find(
        (id) => id !== this.userService.currentUser?.id
      );
      return chatPartnerID
        ? this.userService.getUserByID(chatPartnerID)?.name
        : undefined;
    }
    return undefined;
  }
}
