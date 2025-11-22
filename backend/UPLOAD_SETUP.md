# File Upload Setup

## Overview

The backend now supports file uploads for images. Users can upload images for:
- User profiles
- Categories
- Services

## Implementation Details

### Backend

1. **Upload Module** (`src/upload/`)
   - `upload.service.ts` - Handles file storage and management
   - `upload.controller.ts` - API endpoints for file uploads
   - Files are stored in `uploads/` directory with subdirectories:
     - `uploads/users/`
     - `uploads/categories/`
     - `uploads/services/`

2. **File Storage**
   - Files are stored locally in the `uploads/` directory
   - Each file gets a unique UUID-based filename
   - Original file extension is preserved
   - Files are served statically at `/uploads/{folder}/{filename}`

3. **API Endpoints**
   - `POST /api/upload/image/:folder` - Upload an image
     - Folders: `users`, `categories`, `services`
     - Accepts: multipart/form-data with `file` field
     - Returns: `{ url: string, filename: string, size: number, mimetype: string }`
   - `DELETE /api/upload/image` - Delete an image (by URL)

4. **File Validation**
   - Maximum file size: 5MB
   - Allowed types: jpg, jpeg, png, gif, webp
   - File type validation on upload

### Frontend

1. **Upload Service** (`lib/services/upload.ts`)
   - `uploadImage(file, folder)` - Uploads a file and returns the URL
   - `deleteImage(url)` - Deletes an uploaded file

2. **UI Components**
   - File input with drag-and-drop styling
   - Image preview before upload
   - Upload progress indication
   - Remove image option

## Configuration

### Environment Variables

Add to `.env`:
```env
BASE_URL=http://localhost:3000
```

For production, set to your domain:
```env
BASE_URL=https://yourdomain.com
```

### Static File Serving

The backend automatically serves files from the `uploads/` directory at the `/uploads/` path.

## Usage

### Uploading an Image

1. User selects an image file in the frontend
2. Frontend calls `uploadService.uploadImage(file, 'categories')`
3. Backend saves the file and returns the URL
4. Frontend saves the URL to the database via the create/update API

### Example Flow

```typescript
// Frontend
const file = event.target.files[0];
const imageUrl = await uploadService.uploadImage(file, 'categories');
await catalogService.createCategory({ name: 'Hair Care', imageUrl });
```

## File Structure

```
backend/
├── uploads/              # Created automatically
│   ├── users/
│   ├── categories/
│   └── services/
└── src/
    └── upload/
        ├── upload.module.ts
        ├── upload.service.ts
        └── upload.controller.ts
```

## Production Considerations

For production, consider:

1. **Cloud Storage** (Recommended)
   - Use AWS S3, Google Cloud Storage, or similar
   - Update `upload.service.ts` to upload to cloud storage
   - Return CDN URLs instead of local paths

2. **File Cleanup**
   - Implement cleanup for deleted records
   - Add scheduled jobs to remove orphaned files

3. **Security**
   - Add virus scanning
   - Implement rate limiting on upload endpoint
   - Add file size limits per user/role

4. **Performance**
   - Use CDN for serving images
   - Implement image optimization/resizing
   - Add caching headers

## Migration from URL-based to File Upload

The system still accepts `imageUrl` in DTOs for backward compatibility. You can:
- Upload files (recommended)
- Or provide URLs directly (for external images)

Both methods work, but file upload is the preferred method.

