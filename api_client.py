from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields, reqparse
import requests
import os
from werkzeug.datastructures import FileStorage
import tempfile
import logging

app = Flask(__name__)
app.config['SECRET_KEY'] = 'api-client-secret-key'

# Configure Swagger UI
api = Api(
    app,
    version='1.0',
    title='Aviality Healthcare API Client',
    description='API client for accessing Aviality healthcare data processing services',
    doc='/swagger/',
    prefix='/api/v1'
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base URL of the main Aviality service
AVIALITY_BASE_URL = 'http://localhost:5000'  # Change this to your service URL

# Namespaces for organization
auth_ns = api.namespace('auth', description='Authentication operations')
processing_ns = api.namespace('processing', description='File processing operations')
apikeys_ns = api.namespace('apikeys', description='API key management')

# Models for Swagger documentation
user_model = api.model('User', {
    'name': fields.String(required=True, description='Full name'),
    'email': fields.String(required=True, description='Email address'),
    'password': fields.String(required=True, description='Password (min 6 characters)'),
    'organization': fields.String(description='Organization name', default='Hospital'),
    'department': fields.String(description='Department')
})

login_model = api.model('Login', {
    'email': fields.String(required=True, description='Email address'),
    'password': fields.String(required=True, description='Password')
})

api_key_model = api.model('APIKey', {
    'keyName': fields.String(required=True, description='Name for the API key'),
    'userId': fields.String(required=True, description='User ID')
})

processing_result_model = api.model('ProcessingResult', {
    'filesProcessed': fields.Integer(description='Number of files processed'),
    'piiItemsRemoved': fields.Integer(description='PII items found'),
    'phiItemsDetected': fields.Integer(description='PHI items found'),
    'processingTime': fields.Float(description='Processing time in seconds'),
    'piiPhiData': fields.List(fields.Raw(), description='Structured PII/PHI data')
})

# Helper function for API calls
def make_api_request(method, endpoint, data=None, files=None, headers=None):
    """Make request to the main Aviality API"""
    url = f"{AVIALITY_BASE_URL}{endpoint}"
    try:
        response = requests.request(method, url, json=data, files=files, headers=headers)
        return response.json(), response.status_code
    except requests.RequestException as e:
        logger.error(f"API request failed: {e}")
        return {'success': False, 'detail': f'API request failed: {str(e)}'}, 500

# Authentication endpoints
@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.expect(user_model)
    @auth_ns.doc('register_user')
    def post(self):
        """Register a new user"""
        data = request.get_json()
        response, status_code = make_api_request('POST', '/register', data)
        return response, status_code

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    @auth_ns.doc('login_user')
    def post(self):
        """Login user"""
        data = request.get_json()
        response, status_code = make_api_request('POST', '/login', data)
        return response, status_code

# File processing endpoints
@processing_ns.route('/process-files')
class ProcessFiles(Resource):
    @processing_ns.doc('process_files')
    @processing_ns.expect(reqparse.RequestParser().add_argument('files', type=FileStorage, location='files', action='append', help='Files to process'))
    @processing_ns.expect(reqparse.RequestParser().add_argument('userId', type=str, location='form', help='User ID'))
    @processing_ns.response(200, 'Success', processing_result_model)
    def post(self):
        """Process healthcare files for PII/PHI detection"""
        try:
            # Get files and user ID from request
            files = request.files.getlist('files')
            user_id = request.form.get('userId', 'anonymous')
            
            if not files:
                return {'success': False, 'detail': 'No files provided'}, 400
            
            # Prepare files for forwarding to main API
            files_data = {}
            temp_files = []
            
            for i, file in enumerate(files):
                if file and file.filename:
                    # Create temporary file
                    fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(file.filename)[1])
                    os.close(fd)
                    file.save(temp_path)
                    temp_files.append(temp_path)
                    
                    # Prepare for requests
                    files_data[f'files'] = (file.filename, open(temp_path, 'rb'))
            
            # Forward to main API
            url = f"{AVIALITY_BASE_URL}/api/process-files"
            data = {'userId': user_id}
            
            response = requests.post(url, data=data, files=files_data)
            
            # Clean up temporary files
            for temp_path in temp_files:
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            # Close file handles
            for file_handle in files_data.values():
                if hasattr(file_handle[1], 'close'):
                    file_handle[1].close()
            
            return response.json(), response.status_code
            
        except Exception as e:
            logger.error(f"File processing error: {e}")
            return {'success': False, 'detail': f'Processing failed: {str(e)}'}, 500

@processing_ns.route('/download-results')
class DownloadResults(Resource):
    @processing_ns.doc('download_results')
    def post(self):
        """Download processing results as Excel file"""
        data = request.get_json()
        
        # Forward to main API
        url = f"{AVIALITY_BASE_URL}/api/download-results"
        response = requests.post(url, json=data, stream=True)
        
        if response.status_code == 200:
            return {
                'success': True,
                'message': 'File ready for download',
                'download_url': f"{AVIALITY_BASE_URL}/api/download-results"
            }
        else:
            return response.json(), response.status_code

# API Key management endpoints
@apikeys_ns.route('/generate')
class GenerateAPIKey(Resource):
    @apikeys_ns.expect(api_key_model)
    @apikeys_ns.doc('generate_api_key')
    def post(self):
        """Generate new API key"""
        data = request.get_json()
        response, status_code = make_api_request('POST', '/api/generate-key', data)
        return response, status_code

@apikeys_ns.route('/user/<string:user_id>')
class GetUserAPIKeys(Resource):
    @apikeys_ns.doc('get_user_api_keys')
    def get(self, user_id):
        """Get API keys for a user"""
        response, status_code = make_api_request('GET', f'/api/keys/{user_id}')
        return response, status_code

@apikeys_ns.route('/<string:key_id>')
class RevokeAPIKey(Resource):
    @apikeys_ns.doc('revoke_api_key')
    def delete(self, key_id):
        """Revoke an API key"""
        data = request.get_json()
        response, status_code = make_api_request('DELETE', f'/api/keys/{key_id}', data)
        return response, status_code

# Health check endpoint
@api.route('/health')
class HealthCheck(Resource):
    @api.doc('health_check')
    def get(self):
        """Check API client health and connection to main service"""
        # Check connection to main service
        try:
            response = requests.get(f"{AVIALITY_BASE_URL}/health", timeout=5)
            main_service_status = response.json() if response.status_code == 200 else {'status': 'unreachable'}
        except:
            main_service_status = {'status': 'unreachable'}
        
        return {
            'status': 'healthy',
            'service': 'Aviality API Client',
            'main_service_url': AVIALITY_BASE_URL,
            'main_service_status': main_service_status,
            'swagger_ui': '/swagger/'
        }

# Admin endpoints
admin_ns = api.namespace('admin', description='Administrative operations')

@admin_ns.route('/export-excel/<string:table_name>')
class ExportExcelTable(Resource):
    @admin_ns.doc('export_excel_table')
    def get(self, table_name):
        """Export Excel tables (users, api_keys, processing_sessions, processed_data, redactions_log)"""
        # Forward to main API
        url = f"{AVIALITY_BASE_URL}/api/export-excel/{table_name}"
        response = requests.get(url, stream=True)
        
        if response.status_code == 200:
            return {
                'success': True,
                'message': f'{table_name} export ready',
                'download_url': url
            }
        else:
            try:
                return response.json(), response.status_code
            except:
                return {'success': False, 'detail': 'Export failed'}, response.status_code

@admin_ns.route('/redactions-history/<string:user_id>')
class GetRedactionsHistory(Resource):
    @admin_ns.doc('get_redactions_history')
    def get(self, user_id):
        """Get redactions history for a user"""
        response, status_code = make_api_request('GET', f'/api/redactions-history/{user_id}')
        return response, status_code

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return {'success': False, 'detail': 'Endpoint not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'success': False, 'detail': 'Internal server error'}, 500

if __name__ == '__main__':
    print("🚀 Aviality API Client starting...")
    print("📋 Swagger UI available at: http://localhost:8000/swagger/")
    print("🔗 Main service URL:", AVIALITY_BASE_URL)
    print("🔧 Available endpoints:")
    print("   - POST /api/v1/auth/register - Register new user")
    print("   - POST /api/v1/auth/login - Login user")
    print("   - POST /api/v1/processing/process-files - Process files")
    print("   - POST /api/v1/processing/download-results - Download results")
    print("   - POST /api/v1/apikeys/generate - Generate API key")
    print("   - GET /api/v1/apikeys/user/{user_id} - Get user API keys")
    print("   - DELETE /api/v1/apikeys/{key_id} - Revoke API key")
    print("   - GET /api/v1/admin/export-excel/{table_name} - Export Excel tables")
    print("   - GET /api/v1/admin/redactions-history/{user_id} - Get redactions history")
    
    app.run(debug=True, host='0.0.0.0', port=8000)