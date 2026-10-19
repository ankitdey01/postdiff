# Postdiff UI

Components adapted from the MIT-licensed [COSS UI registry](https://coss.com/ui), retrieved October 2026:

- `Button.tsx`: `https://coss.com/ui/r/button.json`
- `Badge.tsx`: `https://coss.com/ui/r/badge.json`
- `Frame.tsx`: `https://coss.com/ui/r/frame.json`
- `Tabs.tsx`: `https://coss.com/ui/r/tabs.json`, `https://coss.com/ui/r/segmented-control.json`
- `Accordion.tsx`: `https://coss.com/ui/r/accordion.json`

Button/Badge preserve Base UI's `useRender` and `mergeProps` composition. Tabs and Accordion use Base UI for keyboard navigation, focus, state, and panel semantics. Frame is COSS's header/panel/footer composition.

Local adaptations: Postdiff semantic tokens; filled controls rather than outline variants; 6px controls and 12px product frames within the sharp architectural page grid; shorter transitions and reduced-motion overrides. Tabs use static active surfaces instead of a moving indicator. No shadcn global stylesheet is installed.
