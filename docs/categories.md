# Category management

Dashboard → Categories (`/categories`) is the single category-management surface. Settings no longer duplicates these controls, and the sidebar's **Customize** link opens this route directly.

Each category card supports:

- opening its stable `/category/:id` route;
- editing its display name and description without changing the ID;
- showing or hiding its sidebar shortcut through an accessible switch;
- resetting that category to its registry defaults.

**Restore sidebar defaults** shows AI, Utilities, Image and Converters and hides the other shortcuts. It preserves custom names and descriptions. Category overrides remain browser-local for guests and are synchronized through the existing authenticated preferences flow for signed-in users.

Category IDs are registry-owned because app assignments and routes depend on them. The UI intentionally does not create or delete IDs at runtime.
