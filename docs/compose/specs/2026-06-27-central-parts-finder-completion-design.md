# Central Parts Finder - Completion Design Spec

## [S1] Problem
The Central Parts Finder app has a solid foundation but needs completion across search quality, admin management, code organization, UI/UX, and additional system features. The core mission is to help users find any part from participating stores in seconds, with Arabic as primary language.

## [S2] Solution Overview
Work through all gaps in priority order, implementing fixes and enhancements systematically. Focus on search speed, Arabic UX, admin management, code quality, mobile experience, and scalability. Add payment options for store subscriptions, multi-language support (Kurdish), offline support, and supplier network.

## [S3] Core Search & Database Fixes
1. Add database indexes on: part_number, oem_number, name_ar, name_en, brand, store_id, manufacturer_id, vehicle_model
2. Implement Arabic text normalization (alef variants, ta marbuta, etc.)
3. Add search ranking: exact matches > partial matches > alternatives
4. Fix ignored filters: minPrice, maxPrice, origin, condition, vehicleId
5. Add result sorting: lowest price, highest price, nearest store (GPS), most available
6. Populate and use searchVector field for better search
7. Add search result caching

## [S4] Admin & Management Pages
1. Complete category CRUD page (list, create, edit, delete, subcategories)
2. Complete manufacturer CRUD page (list, create, edit, delete)
3. Add store rejection workflow (admin can reject with reason)
4. Add subscription management UI (admin sets plans, discounts, payment methods)
5. Add payment method configuration (Zain Cash, Qi Card, Fast Pay, bank transfer)
6. Add admin discount management (percentage off for subscriptions)
7. Store profile: allow multiple manufacturers per store (many-to-many relationship)
8. Store settings: allow store managers to edit profile, hours, contact info

Note: No inventory approval workflow (store owner responsibility).

## [S5] Code Organization & Testing
1. Extract feature components: SearchBar, FiltersPanel, ResultsList, PartCard, StoreCard, etc.
2. Extract feature hooks: useSearch, useInventory, useStore, etc.
3. Extract shared constants: condition labels, colors, Iraqi cities, etc.
4. Extract shared types and validators
5. Fix file sizes: refactor stores/[id]/page.tsx (307 lines) and parts/[id]/page.tsx (298 lines)
6. Add custom error classes
7. Add structured logging (errors, warnings, auth events, inventory changes)
8. Add rate limiting on API routes
9. Add CSRF protection
10. Add tests for: auth, inventory CRUD, search, permissions, store management

## [S6] UI/UX Enhancements
1. Mobile-first improvements: better mobile filters, touch-friendly, swipe gestures, bottom navigation
2. Arabic typography & RTL: better Arabic fonts, proper RTL layout, Arabic number formatting
3. Search UX: instant results, search history, voice search, image search
4. Dashboard simplicity: simplified store manager interface, fewer clicks, guided flows
5. Speech-to-text (STT) for adding items: native device STT for easy adding, for people who don't read/write
6. Items can be added without photos (optional photos)
7. Language persistence: save language choice to localStorage
8. Dynamic RTL: apply dir attribute to html when switching language
9. i18n completeness: add missing keys, translate all pages
10. Accessibility: keyboard navigation, screen reader support

## [S7] Additional System Features
1. Offline support: PWA with cached search results, offline inventory viewing
2. Multi-language support: Kurdish in addition to Arabic/English (3 languages total)
3. Advanced analytics: demand forecasting, price trend analysis, inventory optimization
4. Supplier network: connect stores with suppliers, wholesale pricing, bulk orders
5. Payment methods for store subscriptions: Zain Cash, Qi Card, Fast Pay, bank transfer
6. Admin discount management: percentage off for subscriptions
7. Subscription plans: basic, premium, enterprise with different limits
8. Store verification workflow: admin verify/reject with reason
9. Audit logging: track all important actions
10. Error boundaries: 404, 500 pages

## [S8] Implementation Order
1. Core search & database fixes (S3) - highest impact
2. Admin & management pages (S4) - fills stubs
3. Code organization & testing (S5) - improves maintainability
4. UI/UX enhancements (S6) - improves user experience
5. Additional system features (S7) - extends platform capabilities

## [S9] Success Criteria
- Search speed improved with indexes and ranking
- Arabic normalization works for all queries
- All admin pages fully functional
- Code organized with feature components/hooks
- Mobile experience smooth and intuitive
- Store subscriptions with local payment methods
- Kurdish language support added
- Offline support via PWA
- Supplier network for wholesale