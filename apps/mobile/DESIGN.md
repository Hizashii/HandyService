# HelpDK mobile design

HeroUI Native supplies button, input, field, card, chip, avatar, alert, spinner and skeleton primitives. Uniwind is the only utility styling engine. No web shadcn components are used.

The supplied Screen1–Screen6 references informed the green identity, warm background, Manrope hierarchy, generous spacing and category composition. No illustrated provider identities or ratings from the references are presented as real.

Theme values live in `src/global.css` and imperative/native theme values in `src/lib/theme`. Light and dark themes share semantic roles. Manrope's individual font faces are mapped to weight utilities. Motion is limited to entrances, progress and component press feedback; the root provider and screen animations respect reduced motion.

## Data and permissions

Authentication and session recovery retain their existing provider and SecureStore behavior. Customer task lists show owned tasks; provider lists show open tasks, as enforced by the existing API. Owners can review and accept quotes; providers can submit integer DKK quotes on open tasks.

The existing task contract has only title and description. Category, location and preferred date are included as readable description lines, with a category marker for client filtering. No schema or API contract was changed. Older tasks without a category marker remain visible under All and searchable by text.

Main's real provider discovery, GPS/manual location, provider contact details and in-memory saved providers are retained. Provider history, service preferences, notifications and account editing have no suitable existing endpoints; these are explained as unavailable rather than simulated.

## Validation

Run `npx tsc --noEmit`, `npm run lint`, `npm test`, `npx expo-doctor` and `npx expo export --platform all` from mobile. API tests cover task creation, provider quote submission, owner acceptance, role checks and session handling. Bundling does not replace device QA: VoiceOver/TalkBack, keyboard behavior, text scaling, small-phone layout and native visual polish still require iOS/Android device review.
