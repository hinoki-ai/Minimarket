# TASKS.md - Minimarket Production Readiness

## Priority Framework
- **P0 (Critical)**: Blocks launch or causes user-facing issues
- **P1 (High)**: Significant impact on user experience
- **P2 (Medium)**: Nice-to-have improvements
- **P3 (Low)**: Future enhancements

---

## P0 - Critical (Fix Immediately)

### Stability & Testing
- [x] **Health Endpoint**: Create `/api/health` returning 200 status ✅ COMPLETED
- [x] **Home Page Test Fix**: Make title static or ensure SSR, update E2E assertions ✅ COMPLETED
- [x] **Monitor Logs**: Add verbose logging to GitHub Actions workflows ✅ COMPLETED
- [x] **E2E Stability**: Fix flaky selectors and timing issues in Playwright tests ✅ COMPLETED

---

## P1 - High Priority (Launch Blockers)

### Performance Essentials
- [ ] **Image Optimization**: Ensure next/image on all hero/product images with proper sizes
- [ ] **Font Loading**: Self-host fonts or use next/font with display: swap
- [ ] **Bundle Analysis**: Remove unused dependencies, optimize first-load JS
- [ ] **Core Web Vitals**: Target LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms

### Accessibility Basics
- [ ] **Heading Structure**: Proper h1-h6 hierarchy across pages
- [ ] **Alt Text**: All images have descriptive alt attributes
- [ ] **Focus Styles**: Visible focus indicators for keyboard navigation
- [ ] **Color Contrast**: Meet WCAG AA standards (4.5:1 ratio)

### SEO Fundamentals
- [ ] **Page Titles**: Unique, descriptive titles for all pages
- [ ] **Meta Descriptions**: Compelling descriptions for key pages
- [ ] **Canonical URLs**: Prevent duplicate content issues
- [ ] **Basic OpenGraph**: Title, description, image for social sharing

---

## P2 - Medium Priority (Post-Launch)

### User Experience
- [ ] **Mobile Optimization**: Ensure responsive design works on small screens
- [ ] **Loading States**: Add skeleton loaders for async content
- [ ] **Error Boundaries**: Graceful error handling for React components
- [ ] **404 Page**: Custom not-found page with navigation

### Content & Localization
- [ ] **Spanish Content Review**: Verify tone and terminology for Chilean market
- [ ] **Currency Formatting**: Display prices in CLP format
- [ ] **Date/Number Locale**: Use Chilean formatting standards

### Basic Security
- [ ] **Environment Variables**: Ensure no secrets in client-side code
- [ ] **Basic CSP**: Content Security Policy for XSS protection
- [ ] **HTTPS Redirect**: Force HTTPS in production

---

## P3 - Low Priority (Future Enhancements)

### Advanced Features
- [ ] **Search Functionality**: Product search with filters
- [ ] **User Reviews**: Customer review system
- [ ] **Wishlist**: Save items for later
- [ ] **Order History**: User purchase history

### Performance Advanced
- [ ] **Service Worker**: Basic caching for offline functionality
- [ ] **Image Optimization**: AVIF/WebP formats with fallbacks
- [ ] **Lazy Loading**: Below-the-fold content optimization

### Analytics & Monitoring
- [ ] **Basic Analytics**: Google Analytics or Vercel Analytics
- [ ] **Error Tracking**: Simple error logging (not full Sentry)
- [ ] **Performance Monitoring**: Basic Web Vitals tracking

---

## Implementation Notes

### Quick Wins (Can be done today)
1. Health endpoint: Simple 200 response
2. Image optimization: Add `sizes` prop to existing next/image
3. Font loading: Use next/font/google with display: swap
4. Alt text audit: Review all images

### Development Guidelines
- **Keep it simple**: Avoid over-engineering solutions
- **User-first**: Focus on what improves actual user experience
- **Measure impact**: Only optimize what can be measured
- **Progressive enhancement**: Start basic, add features incrementally

### Success Metrics
- **Lighthouse Scores**: Performance >85, Accessibility >90, SEO >90
- **Core Web Vitals**: All "Good" thresholds in field data
- **E2E Tests**: Green across all browsers
- **User Feedback**: No critical usability issues reported

---

## Rejected/Deferred Items

### Too Complex for Launch
- Advanced monitoring (Sentry, RUM, alerting)
- Enterprise security headers
- Multi-device testing matrix
- Advanced caching strategies
- PWA capabilities
- Sophisticated CI/CD pipelines

### Rationale
These items add complexity without proportional value for a launching e-commerce site. Focus on core functionality, user experience, and basic performance first.