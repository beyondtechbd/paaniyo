import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile, deleteFile, getPresignedUploadUrl } from '@/lib/storage';

// Folder permissions by role
const FOLDER_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['products', 'brands', 'users', 'uploads'],
  VENDOR: ['products', 'brands'],
  CUSTOMER: ['users'],
};

// POST /api/upload - Upload file directly
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check folder permissions
    const userRole = session.user.role || 'CUSTOMER';
    const allowedFolders = FOLDER_PERMISSIONS[userRole] || ['users'];
    
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json(
        { error: 'You do not have permission to upload to this folder' },
        { status: 403 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to R2
    const result = await uploadFile(buffer, file.name, file.type, folder);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET /api/upload - Get presigned URL for client-side upload
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const contentType = searchParams.get('contentType');
    const folder = searchParams.get('folder') || 'uploads';

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    // Check folder permissions
    const userRole = session.user.role || 'CUSTOMER';
    const allowedFolders = FOLDER_PERMISSIONS[userRole] || ['users'];
    
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json(
        { error: 'You do not have permission to upload to this folder' },
        { status: 403 }
      );
    }

    const result = await getPresignedUploadUrl(filename, contentType, folder);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and vendors can delete files
    if (!['ADMIN', 'VENDOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete files' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    // Vendors can only delete their own product/brand images
    if (session.user.role === 'VENDOR') {
      if (!key.startsWith('products/') && !key.startsWith('brands/')) {
        return NextResponse.json(
          { error: 'You can only delete your own product or brand images' },
          { status: 403 }
        );
      }
    }

    const result = await deleteFile(key);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
