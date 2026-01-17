const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const logger = require('../utils/logger');
const {
    isS3Configured,
    uploadToS3,
    s3Storage
} = require('../config/aws');
=======
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const logger = require('../utils/logger');
const {
    isS3Configured,
    uploadToS3,
    s3Storage
} = require('../config/aws');
