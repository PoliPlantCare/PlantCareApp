# PlantCare patches

Use `plant-crud-detail-ui.patch` from the repository root (the folder that contains `src/`).

```bash
git apply --check patches/plant-crud-detail-ui.patch
git apply patches/plant-crud-detail-ui.patch
```

If you are one directory above the app folder (the folder that contains `PlantCareApp/`), use the parent-directory variant:

```bash
git apply --check PlantCareApp/patches/plant-crud-detail-ui.from-parent.patch
git apply PlantCareApp/patches/plant-crud-detail-ui.from-parent.patch
```

If you previously applied only part of a patch, reset the partial file first:

```bash
git restore src/types/plant.ts
```
