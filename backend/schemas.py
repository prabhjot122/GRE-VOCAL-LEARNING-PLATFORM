from marshmallow import Schema, fields, validate, ValidationError

class UserRegistrationSchema(Schema):
    """Schema for user registration validation"""
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=30),
            validate.Regexp(
                r'^[a-zA-Z0-9_-]+$',
                error='Username can only contain letters, numbers, hyphens, and underscores'
            )
        ]
    )
    email = fields.Email(required=True)
    password = fields.Str(
        required=True,
        validate=validate.Length(min=6, max=128)
    )
    confirm_password = fields.Str(required=True)

class UserLoginSchema(Schema):
    """Schema for user login validation"""
    username_or_email = fields.Str(required=True)
    password = fields.Str(required=True)

class LibrarySchema(Schema):
    """Schema for library validation"""
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100)
    )
    description = fields.Str(
        validate=validate.Length(max=500),
        allow_none=True
    )

class WordSchema(Schema):
    """Schema for word validation"""
    word = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100)
    )
    meaning = fields.Str(required=True)
    pronunciation = fields.Str(
        validate=validate.Length(max=200),
        allow_none=True
    )
    example = fields.Str(allow_none=True)
    difficulty = fields.Str(
        validate=validate.OneOf(['easy', 'medium', 'hard']),
        missing='medium'
    )

class StorySchema(Schema):
    """Schema for story validation"""
    title = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=200)
    )
    content = fields.Str(required=True)
    genre = fields.Str(
        validate=validate.Length(max=50),
        allow_none=True
    )
    keywords = fields.List(fields.Str(), allow_none=True)
    is_public = fields.Bool(missing=False)

class CSVUploadSchema(Schema):
    """Schema for CSV upload validation"""
    library_id = fields.Int(required=True)
    overwrite_existing = fields.Bool(missing=False)

# Response schemas for consistent API responses
class SuccessResponseSchema(Schema):
    """Schema for successful API responses"""
    success = fields.Bool(default=True)
    message = fields.Str()
    data = fields.Raw()

class ErrorResponseSchema(Schema):
    """Schema for error API responses"""
    success = fields.Bool(default=False)
    error = fields.Str(required=True)
    details = fields.List(fields.Str(), allow_none=True)
