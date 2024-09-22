import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarDirective } from '../../utils/directives/avatar.directive';
import { NavigationService } from '../../utils/services/navigation.service';
import { Channel } from '../../shared/models/channel.class';
import { Chat } from '../../shared/models/chat.class';
import { MessageComponent } from '../chatview/messages-list-view/message/message.component';
import { Message } from '../../shared/models/message.class';
import { UsersService } from '../../utils/services/user.service';
import { MessagesListViewComponent } from '../chatview/messages-list-view/messages-list-view.component';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { MessageDateComponent } from '../chatview/messages-list-view/message-date/message-date.component';

@Component({
  selector: 'app-threadview',
  standalone: true,
  imports: [
    CommonModule,
    AvatarDirective,
    MessageComponent,
    MessageDateComponent,
    MessagesListViewComponent,
    MessageTextareaComponent,
  ],
  templateUrl: './threadview.component.html',
  styleUrl: './threadview.component.scss',
})
export class ThreadviewComponent {
  public messages: Message[] = [];
  public navigationService = inject(NavigationService);
  public userService = inject(UsersService);
  public isAChannel = false;
  public isAChat = false;
  public isDefaultChannel = true;
  public requiredAvatars: string[] = [];
  public messagesDates: Date[] = [];

  @Input() currentChannel!: Channel | Chat;

  @Input()
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentChannel']) {
      this.currentChannel = changes['currentChannel'].currentValue;
      this.currentChannel instanceof Channel &&
      this.currentChannel.defaultChannel
        ? (this.isDefaultChannel = true)
        : (this.isDefaultChannel = false);
      this.setObjectType();
      this.getRequiredAvatars();
      console.log(this.currentChannel);
    }
  }

  @Input() toggleThreadView!: () => void;

  triggerToggleThreadView() {
    if (this.toggleThreadView) {
      this.toggleThreadView();
    }
  }

  constructor(private cdr: ChangeDetectorRef) {}

  getTitle(object: Channel | Chat | Message | undefined): string {
    if (object instanceof Channel) return object.name;
    return '';
  }

  setObjectType() {
    if (this.currentChannel instanceof Channel) this.isAChannel = true;
    if (this.currentChannel instanceof Chat) this.isAChat = true;
  }

  getRequiredAvatars() {
    if (this.currentChannel instanceof Channel) {
      this.requiredAvatars = this.currentChannel.memberIDs.slice(0, 3);
    }
  }
}
