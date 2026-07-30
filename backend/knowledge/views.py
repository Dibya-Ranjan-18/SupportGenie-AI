"""
Knowledge base views — Document upload, listing, deletion, re-indexing.
"""
import threading
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.db.models import Sum

from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer, IndexURLSerializer
from .embedding_service import index_document, delete_document_from_index, index_url_content
from accounts.permissions import IsAdmin

logger = logging.getLogger(__name__)


def _index_document_async(document):
    """Run document indexing in background thread."""
    try:
        document.status = 'processing'
        document.save()

        # Determine file type from extension
        file_name = document.file.name.lower()
        if file_name.endswith('.pdf'):
            document.file_type = 'pdf'
        elif file_name.endswith('.docx'):
            document.file_type = 'docx'
        elif file_name.endswith('.txt'):
            document.file_type = 'txt'
        document.save()

        chunk_count = index_document(document)
        document.chunk_count = chunk_count
        document.status = 'indexed'
        document.save()
        logger.info(f"Document '{document.title}' indexed successfully with {chunk_count} chunks.")
    except Exception as e:
        logger.error(f"Document indexing failed for '{document.title}': {e}")
        document.status = 'failed'
        document.error_message = str(e)[:500]
        document.save()


class DocumentListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        """List all documents with optional search."""
        search = request.query_params.get('search', '')
        queryset = Document.objects.all()
        if search:
            queryset = queryset.filter(title__icontains=search)
        serializer = DocumentSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Upload and index a new document."""
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        file_name = file.name.lower()

        # Determine file type
        if file_name.endswith('.pdf'):
            file_type = 'pdf'
        elif file_name.endswith('.docx'):
            file_type = 'docx'
        elif file_name.endswith('.txt'):
            file_type = 'txt'
        else:
            return Response({'error': 'Unsupported file type.'}, status=status.HTTP_400_BAD_REQUEST)

        document = Document.objects.create(
            title=serializer.validated_data['title'],
            file=file,
            file_type=file_type,
            file_size=file.size,
            uploaded_by=request.user,
            status='pending',
        )

        # Start indexing in background thread
        thread = threading.Thread(target=_index_document_async, args=(document,), daemon=True)
        thread.start()

        return Response(
            DocumentSerializer(document, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class DocumentDetailView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self, doc_id):
        try:
            return Document.objects.get(id=doc_id)
        except Document.DoesNotExist:
            return None

    def get(self, request, doc_id):
        doc = self.get_object(doc_id)
        if not doc:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = DocumentSerializer(doc, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, doc_id):
        doc = self.get_object(doc_id)
        if not doc:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        title = doc.title
        # Delete file from disk
        try:
            doc.file.delete(save=False)
        except Exception:
            pass

        doc.delete()

        # Remove from FAISS index in background
        thread = threading.Thread(
            target=delete_document_from_index, args=(title,), daemon=True
        )
        thread.start()

        return Response({'message': 'Document deleted.'}, status=status.HTTP_204_NO_CONTENT)


class DocumentReindexView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, doc_id):
        """Re-embed and re-index a document."""
        try:
            doc = Document.objects.get(id=doc_id)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        if doc.status == 'processing':
            return Response({'error': 'Document is already being processed.'}, status=status.HTTP_400_BAD_REQUEST)

        thread = threading.Thread(target=_index_document_async, args=(doc,), daemon=True)
        thread.start()

        return Response({'message': 'Re-indexing started.', 'document_id': str(doc.id)})


class KnowledgeBaseStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total = Document.objects.count()
        indexed = Document.objects.filter(status='indexed').count()
        processing = Document.objects.filter(status='processing').count()
        failed = Document.objects.filter(status='failed').count()
        # Use SQL aggregate instead of loading all rows into Python memory
        total_chunks = Document.objects.aggregate(total=Sum('chunk_count'))['total'] or 0

        return Response({
            'total_documents': total,
            'indexed': indexed,
            'processing': processing,
            'failed': failed,
            'total_chunks': total_chunks,
        })


class IndexURLView(APIView):
    """Scrape and index a webpage URL into FAISS RAG."""
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = IndexURLSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        url = serializer.validated_data['url']
        title = serializer.validated_data.get('title', '')

        try:
            doc = index_url_content(url=url, title=title, user=request.user)
            return Response(
                DocumentSerializer(doc, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"URL indexing error for {url}: {e}")
            return Response({'error': f'Failed to index webpage: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
