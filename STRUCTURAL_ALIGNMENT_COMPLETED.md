# 📋 AlLibrary Structural Alignment Completion Plan

This plan details the phased tasks required to complete the structural alignment of the AlLibrary project, ensuring full compliance with `allibrary-coding-rules.mdc` and `allibrary-custom-rules.mdc`. Each phase includes actionable tasks and checklists to guarantee that all styles, logic, and UI/UX remain unchanged, with only the file structure and organization improved.

---

## **Phase 1: Directory Structure Creation & Preparation**

### **Tasks**

- [ ] Inventory all files and directories in the old codebase (`old/DesktopApp_AlLibrary/src/`).
- [ ] Create the new directory tree in `src/` as per coding rules:
  - [ ] `pages/` (one page = one directory)
  - [ ] `components/` (foundation, domain, composite, layout, cultural)
  - [ ] `services/`, `stores/`, `types/`, `utils/`, `hooks/`, `styles/`, `assets/`, `constants/`, `config/`, `i18n/`, `routes/`, `tests/`
- [ ] For each directory, add:
  - [ ] `index.ts` for exports
  - [ ] `README.md` with structure, usage, and testing info
  - [ ] `types.ts` if applicable

### **Checklist**

- [ ] All required directories exist
- [ ] All directories have documentation and export files

---

## **Phase 2: Component & Page Migration**

### **Tasks**

- [ ] For each page in the old codebase:
  - [ ] Create a directory under `src/pages/` (e.g., `Home/`, `Search/`)
  - [ ] Move `.tsx`, `.css`, `.test.tsx`, hooks, and types into the page directory
  - [ ] Rename CSS to `.module.css` and update imports
  - [ ] Add `index.ts` for exports
- [ ] For each component:
  - [ ] Move to the correct level (`foundation/`, `domain/`, `composite/`, `layout/`, `cultural/`)
  - [ ] Create a directory for each component
  - [ ] Move `.tsx`, `.module.css`, `.test.tsx`, hooks, and types
  - [ ] Add `index.ts` for exports
- [ ] Move all global and component styles to `src/styles/` and `src/components/.../*.module.css`
- [ ] Move assets to `src/assets/`

### **Checklist**

- [ ] All pages and components are in the correct directories
- [ ] All styles and assets are preserved and referenced correctly
- [ ] No logic or style regressions

---

## **Phase 3: Services, Stores, Types, Utils, Hooks Migration**

### **Tasks**

- [ ] Organize services by domain (api, security, cultural, network, storage)
- [ ] Organize stores by domain (document, collection, user, cultural, network)
- [ ] Split types into core, api, models, cultural, security, and index files
- [ ] Organize utils by formatting, validation, security, helpers
- [ ] Organize hooks by api, ui, data, cultural

### **Checklist**

- [ ] All logic is in the correct domain directory
- [ ] All files have `index.ts` and documentation

---

## **Phase 4: Constants & Config Setup**

### **Tasks**

- [ ] Create `src/constants/` and `src/config/` directories
- [ ] Move and organize all relevant constants and config files
- [ ] Add `index.ts` and documentation

### **Checklist**

- [ ] All constants and configs are centralized and documented

---

## **Phase 5: Testing Structure Alignment**

### **Tasks**

- [ ] Move all test files to the correct `src/tests/` subdirectories
- [ ] Ensure every component/page has a corresponding test file
- [ ] Add/adjust test setup files as needed

### **Checklist**

- [ ] All tests are in the correct location and pass
- [ ] Test coverage >80% for all code

---

## **Phase 6: Documentation & Progress Tracking**

### **Tasks**

- [ ] Add a `README.md` to every directory (see rules template)
- [ ] Update or create `recent_history.md`, `Project Progress.md`, and implementation progress files
- [ ] Ensure all components and functions have JSDoc/type annotations

### **Checklist**

- [ ] All directories and files are documented
- [ ] Progress and history files are up to date

---

## **Phase 7: Import/Export Refactoring**

### **Tasks**

- [ ] Update all import paths to use absolute imports (`@/components/...`)
- [ ] Ensure all directories use `index.ts` for exports
- [ ] Follow the mandatory import order

### **Checklist**

- [ ] No relative imports for internal modules
- [ ] All exports are clean and consistent

---

## **Phase 8: Validation & Quality Gates**

### **Tasks**

- [ ] Run all tests, type checks, and linters
- [ ] Validate accessibility (WCAG 2.1 AA), performance, and security
- [ ] Ensure all cultural information is informational only (no access control)
- [ ] Confirm all documentation and progress tracking is up to date

### **Checklist**

- [ ] All quality gates are passed
- [ ] No regressions or rule violations

---

## **Phase 9: Final Review & Handover**

### **Tasks**

- [ ] Review the new structure for 100% compliance with all rules
- [ ] Document any deviations or open questions
- [ ] Prepare a summary of changes for the team

### **Checklist**

- [ ] Structure is fully aligned
- [ ] All documentation and code are ready for further development

---

**This plan ensures the AlLibrary project is structurally aligned, fully documented, and ready for secure, decentralized, anti-censorship development.**
