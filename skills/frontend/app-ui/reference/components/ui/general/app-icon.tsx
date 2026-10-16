import {
  BookmarkRemove02Icon,
  FilterHorizontalIcon,
  Video01Icon,
  TextIcon,
  NoteRemoveIcon,
  Link01Icon,
  ImageNotFound01Icon,
  Image01Icon,
  Album02Icon,
  AiBrain01Icon,
  Alert02Icon,
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUp02Icon,
  ArrowUpRight01Icon,
  Attachment01Icon,
  Bookmark02Icon,
  BrainIcon,
  BubbleChatIcon,
  Calendar03Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Clock01Icon,
  ClockAlertIcon,
  Comment01Icon,
  ComputerIcon,
  CrownIcon,
  Copy01Icon,
  DashboardSpeed01Icon,
  DashboardSquare01Icon,
  DashedLineCircleIcon,
  DatabaseIcon,
  Delete02Icon,
  Download04Icon,
  EarthIcon,
  Facebook01Icon,
  File02Icon,
  InformationCircleIcon,
  InstagramIcon,
  KanbanIcon,
  LeftToRightListBulletIcon,
  LibraryIcon,
  Logout01Icon,
  MessengerIcon,
  MetaIcon,
  MagnetIcon,
  MessageMultiple01Icon,
  Mic01Icon,
  MinusSignIcon,
  PaintBrush01Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  PlusSignCircleIcon,
  PlusSignIcon,
  Progress02Icon,
  Search01Icon,
  Share08Icon,
  SidebarRight01Icon,
  SidebarRightIcon,
  SlidersHorizontalIcon,
  Settings01Icon,
  SortByDown02Icon,
  SortByUp02Icon,
  StopIcon,
  Target02Icon,
  TaskDaily01Icon,
  ThreadsIcon,
  ThumbsUpIcon,
  Tick02Icon,
  UserAdd01Icon,
  UserCircleIcon,
  UserGroupIcon,
  UserMultiple02Icon,
  UserSearch01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  WhatsappIcon,
  ZapIcon,
  ShoppingBag02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import { MorphIcon } from "morphicons/react";
import type { MorphIconProps } from "morphicons/react";
import type { ComponentProps } from "react";

// Every icon in the app, by what it means here, drawn from Hugeicons' free
// stroke set (@hugeicons/core-free-icons): 1.5px strokes in currentColor, so
// an icon takes its text color. Callers name the meaning ("agent-send"), not
// the artwork, so changing an icon is one line here. Sizes come from CSS
// (icon.css and each component's [data-slot="app-icon"] rules).
const appIcons = {
  search: Search01Icon,
  "join-group": UserAdd01Icon,
  close: Cancel01Icon,
  grid: DashboardSquare01Icon,
  groups: UserGroupIcon,
  logout: Logout01Icon,
  "sidebar-close": SidebarRight01Icon,
  "sidebar-open": SidebarRightIcon,
  "chevron-down-small": ArrowDown01Icon,
  "chevron-down": ArrowDown01Icon,
  "chevron-up": ArrowUp01Icon,
  "chevron-left": ArrowLeft01Icon,
  "chevron-right": ArrowRight01Icon,
  bookmark: Bookmark02Icon,
  "bookmark-remove": BookmarkRemove02Icon,
  checkmark: Tick02Icon,
  eye: ViewIcon,
  "eye-off": ViewOffSlashIcon,
  minus: MinusSignIcon,
  more: MoreHorizontalIcon,
  "list-bullet": LeftToRightListBulletIcon,
  filter: FilterHorizontalIcon,
  posts: MessageMultiple01Icon,
  profile: UserCircleIcon,
  "agent-plus": PlusSignIcon,
  "agent-microphone": Mic01Icon,
  "agent-speech-bubble": BubbleChatIcon,
  "agent-trash": Delete02Icon,
  "agent-attach": Attachment01Icon,
  "agent-send": ArrowUp02Icon,
  "agent-stop": StopIcon,
  "agent-scroll-down": ArrowDown02Icon,
  "agent-chevron-right": ArrowRight01Icon,
  "agent-tasks": TaskDaily01Icon,
  "agent-remove": Cancel01Icon,
  "agent-file": File02Icon,
  copy: Copy01Icon,
  "agent-clock": Clock01Icon,
  "agent-check": Tick02Icon,
  "agent-add": PlusSignIcon,
  "agent-search": Search01Icon,
  "agent-users": UserGroupIcon,
  "agent-chart": Analytics01Icon,
  "agent-target": Target02Icon,
  "agent-status-backlog": DashedLineCircleIcon,
  "agent-status-todo": CircleIcon,
  "agent-status-progress": Progress02Icon,
  "agent-status-done": CheckmarkCircle02Icon,
  opportunities: MagnetIcon,
  "agent-brain": AiBrain01Icon,
  "agent-arrow-up-right": ArrowUpRight01Icon,
  "agent-zap": ZapIcon,
  "agent-circle": CircleIcon,
  "agent-clock-alert": ClockAlertIcon,
  "agent-circle-x": CancelCircleIcon,
  "agent-circle-check": CheckmarkCircle02Icon,
  "agent-chevron-left": ArrowLeft01Icon,
  "agent-close": Cancel01Icon,
  "agent-pin": PinIcon,
  "agent-pin-off": PinOffIcon,
  "agent-pencil": PencilEdit02Icon,
  "agent-download": Download04Icon,
  "agent-bubble-chat": BubbleChatIcon,
  "tasks-kanban": KanbanIcon,
  "tasks-list": LeftToRightListBulletIcon,
  "tasks-plus-circle": PlusSignCircleIcon,
  "tasks-view": SlidersHorizontalIcon,
  "tasks-calendar": Calendar03Icon,
  "notifications-bell": Notification01Icon,
  "post-like": ThumbsUpIcon,
  "nav-tasks": TaskDaily01Icon,
  "nav-preferences": Target02Icon,
  "nav-facebook-accounts": Facebook01Icon,
  "nav-automation": DashboardSpeed01Icon,
  "nav-memory": BrainIcon,
  "nav-data": DatabaseIcon,
  "nav-settings": Settings01Icon,
  "nav-appearance": PaintBrush01Icon,
  "nav-plan": CrownIcon,
  "theme-system": ComputerIcon,
  "nav-my-groups": UserMultiple02Icon,
  "nav-group-search": UserSearch01Icon,
  "video-play": PlayIcon,
  "post-comment": Comment01Icon,
  "post-share": Share08Icon,
  // The posts page's post kinds (groupPostContentKind).
  "post-kind-text": TextIcon,
  "post-kind-photo": Image01Icon,
  "post-kind-carousel": Album02Icon,
  "post-kind-video": Video01Icon,
  "post-kind-link": Link01Icon,
  "post-kind-unavailable": ImageNotFound01Icon,
  "post-kind-empty": NoteRemoveIcon,
  // The Ad Library's product catalog ads (DPA); its other kinds use the
  // post kinds' icons.
  "ad-kind-catalog": ShoppingBag02Icon,
  "post-public": EarthIcon,
  // The dashboard's four numbers (GroupSummaryCards).
  "summary-groups-found": UserSearch01Icon,
  "summary-details": InformationCircleIcon,
  "summary-public": EarthIcon,
  "summary-members": UserMultiple02Icon,
  "sort-up": SortByUp02Icon,
  "sort-down": SortByDown02Icon,
  "ad-library": LibraryIcon,
  "ad-active": CheckmarkCircle02Icon,
  "ad-inactive": CancelCircleIcon,
  "ad-info": InformationCircleIcon,
  "ad-warning": Alert02Icon,
  calendar: Calendar03Icon,
  "calendar-chevron-left": ArrowLeft01Icon,
  "calendar-chevron-right": ArrowRight01Icon,
  "platform-facebook": Facebook01Icon,
  "platform-instagram": InstagramIcon,
  "platform-audience_network": MetaIcon,
  "platform-messenger": MessengerIcon,
  "platform-whatsapp": WhatsappIcon,
  "platform-threads": ThreadsIcon,
} as const;

type AppIconName = keyof typeof appIcons;

// Decorative: the control or text beside it carries the name.
const AppIcon = ({
  icon,
  className,
  ...props
}: Omit<ComponentProps<"svg">, "children" | "strokeWidth"> & {
  icon: AppIconName;
}) => (
  <HugeiconsIcon
    {...props}
    icon={appIcons[icon]}
    data-slot="app-icon"
    aria-hidden="true"
    className={cn("app-icon", className)}
  />
);

// The pulse dot as an icon: a 1.5-unit circle drawn with a 9-unit stroke
// (.app-morph-icon[data-dot] in icon.css thickens it and pulses it),
// 8px at the 16px icon size. A real path, so it can morph into any icon.
const appPulseDot = "M12 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3Z";

// An icon that morphs into the next one when `icon` changes (morphicons'
// "snappy" spring; an instant swap under reduced motion), as the agent
// chat's status line goes from the pulse dot to each step. Decorative, like
// AppIcon.
const AppMorphIcon = ({
  icon,
  className,
  ...props
}: Omit<MorphIconProps, "icon" | "children" | "strokeWidth"> & {
  icon: AppIconName | "pulse-dot";
}) => (
  <MorphIcon
    {...props}
    icon={icon === "pulse-dot" ? appPulseDot : appIcons[icon]}
    data-slot="app-icon"
    data-dot={icon === "pulse-dot" ? "" : undefined}
    aria-hidden="true"
    className={cn("app-icon app-morph-icon", className)}
    strokeWidth={1.5}
    spring="snappy"
    reducedMotion="user"
  />
);

export { AppIcon, AppMorphIcon };

export type { AppIconName };
