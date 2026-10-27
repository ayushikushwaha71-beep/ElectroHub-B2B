/**
 * ElectroHub UI Component Library
 * Barrel export for all reusable components.
 *
 * Usage: import { Button, ProductCard, Badge } from '@/components/ui';
 */

// ─── Core Interaction ──────────────────────────────────────────────────────────
export { Button, MotionButton, buttonVariants }       from './Button';
export type { ButtonProps }                           from './Button';

export { Input, Textarea, inputVariants }             from './Input';
export type { InputProps, TextareaProps }             from './Input';

export { SearchBar }                                  from './SearchBar';
export type { SearchBarProps, SearchSuggestionItem }  from './SearchBar';

// ─── Feedback ─────────────────────────────────────────────────────────────────
export { Badge, badgeVariants }                       from './Badge';
export type { BadgeProps }                            from './Badge';

export { toast, Toaster }                             from './Toast';

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonProductCard,
  SkeletonCategoryCard,
  SkeletonReviewCard,
  SkeletonPage,
}                                                     from './Skeleton';

export {
  Spinner,
  DotsLoader,
  PulseRing,
  FullPageLoading,
  InlineLoading,
  ButtonSpinner,
}                                                     from './Loading';

export { EmptyState }                                 from './EmptyState';
export type { EmptyStateProps, EmptyStatePreset }     from './EmptyState';

// ─── Overlays ─────────────────────────────────────────────────────────────────
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogSeparator,
}                                                     from './Dialog';

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetBody,
  SheetTitle,
  SheetDescription,
}                                                     from './Sheet';

export { Drawer }                                     from './Drawer';
export type { DrawerProps }                           from './Drawer';

export { Modal }                                      from './Modal';
export type { ModalProps, ModalAction }               from './Modal';

// ─── Navigation ───────────────────────────────────────────────────────────────
export { Breadcrumb }                                 from './Breadcrumb';
export type { BreadcrumbProps, BreadcrumbItem }       from './Breadcrumb';

export { Pagination }                                 from './Pagination';
export type { PaginationProps }                       from './Pagination';

// ─── Cards ────────────────────────────────────────────────────────────────────
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  CardImage,
  StatCard,
  cardVariants,
}                                                     from './Card';
export type { CardProps, StatCardProps }              from './Card';

export { ProductCard, StarRating }                    from './ProductCard';
export type { ProductCardProps }                      from './ProductCard';

export { CategoryCard }                               from './CategoryCard';
export type { CategoryCardProps }                     from './CategoryCard';

export { BrandCard }                                  from './BrandCard';
export type { BrandCardProps }                        from './BrandCard';

export {
  ReviewCard,
  RatingSummary,
  Stars,
  Avatar,
}                                                     from './ReviewCard';
export type { ReviewCardProps, RatingSummaryProps }   from './ReviewCard';
