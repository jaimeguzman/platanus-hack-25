# Deployment Guide

## Overview

Deployment strategy for SecondBrain: Vercel (frontend) + AWS Lambda (API).

**Cost**: Minimal for hackathon (Vercel free tier, AWS free tier)
**Time**: ~1-2 hours for first deployment

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account with repo access
- Vercel account (free)

### Step 1: Push to GitHub

```bash
cd /Users/jaimeguzman/Dev/platanus-hack-25
git add .
git commit -m "feat: complete SecondBrain MVP"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select `platanus-hack-25` repository
5. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `apps/fe-webapp`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://api-sst-xxxxx.lambda-url.us-east-1.on.aws
   ```
   (Use actual Lambda URL after API deployment)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build (2-5 minutes)
3. Get URL: `https://platanus-hack-25.vercel.app`

### Automatic Deployments

Vercel auto-deploys on:
- Push to `main` branch
- Pull request (preview deployment)
- Manual redeploy from dashboard

### Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records (Vercel provides instructions)

---

## API Deployment (AWS Lambda)

### Prerequisites
- AWS account (free tier available)
- AWS CLI installed
- Node.js 20+

### Option A: Using AWS Console (Easiest)

#### Step 1: Prepare Package

```bash
cd apis/api-sst

# Create deployment package
pip install -r requirements.txt -t package/
cp main.py package/
cd package && zip -r ../function.zip . && cd ..

# Verify zip size (< 50 MB for Lambda)
ls -lh function.zip
```

#### Step 2: Create Lambda Function

1. Go to AWS Console → Lambda → Create Function
2. Configure:
   - **Name**: `platanus-sst-api`
   - **Runtime**: Python 3.11
   - **Architecture**: x86_64
   - **Handler**: `main.handler` (Mangum handler)

3. Upload `function.zip`:
   - Click Upload → From .zip file
   - Select `function.zip`

#### Step 3: Add Environment Variables

1. Lambda Function → Configuration → Environment variables
2. Add:
   ```
   OPENAI_API_KEY=sk-proj-xxxxx...
   ```

#### Step 4: Configure Timeout

1. Configuration → General Configuration
2. Set Timeout: `60` seconds (matches OpenAI Whisper processing time)

#### Step 5: Add API Gateway Trigger

1. Configuration → Add Trigger
2. Select: API Gateway
3. Create new API: REST API
4. Configuration:
   - **API Type**: REST
   - **Security**: Open
5. Click Add

#### Step 6: Get API URL

1. Triggers → API Gateway → Details
2. Copy **API endpoint**: `https://xxxxx.lambda-url.region.on.aws`

### Option B: Using AWS SAM (Infrastructure as Code)

Create `template.yaml`:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 60
    MemorySize: 512

Resources:
  SecondBrainAPI:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: platanus-sst-api
      CodeUri: .
      Handler: main.handler
      Runtime: python3.11
      Environment:
        Variables:
          OPENAI_API_KEY: !Sub '{{resolve:secretsmanager:openai-api-key:SecretString:api_key}}'
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /{proxy+}
            Method: ANY

  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: SecondBrain-API

Outputs:
  ApiEndpoint:
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/Prod'
```

Deploy:
```bash
sam build
sam deploy --guided
```

### Option C: Using Serverless Framework

Install:
```bash
npm install -g serverless
```

Create `serverless.yml`:
```yaml
service: platanus-sst-api

provider:
  name: aws
  runtime: python3.11
  region: us-east-1
  environment:
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}

functions:
  api:
    handler: main.handler
    timeout: 60
    memorySize: 512
    events:
      - http:
          path: /{proxy+}
          method: ANY

plugins:
  - serverless-python-requirements
```

Deploy:
```bash
serverless deploy --param="openaiKey=sk-proj-xxxxx"
```

---

## Testing Deployments

### Test Frontend

```bash
curl https://platanus-hack-25.vercel.app
# Should return HTML (200)

curl https://platanus-hack-25.vercel.app/api/health
# If health endpoint exists (optional)
```

### Test API

```bash
# List Lambda functions
aws lambda list-functions --region us-east-1

# Test endpoint
curl -X POST https://xxxxx.lambda-url.us-east-1.on.aws/speech-to-text \
  -F "file=@test-audio.mp3"

# Should return: { "text": "..." }
```

### End-to-End Test

1. Open https://platanus-hack-25.vercel.app
2. Click "Transcribe Audio"
3. Record or upload audio
4. Click "Transcribe"
5. Verify transcription appears

---

## Monitoring & Debugging

### Frontend (Vercel)

**View Logs**:
1. Vercel Dashboard → Select project
2. Deployments → Click deployment
3. View Build Logs, Runtime Logs

**Analytics**:
1. Analytics tab
2. Monitor performance, errors, user experience

### API (AWS Lambda)

**View Logs**:
```bash
# Using AWS CLI
aws logs tail /aws/lambda/platanus-sst-api --follow

# Or CloudWatch Console
# Lambda → platanus-sst-api → Monitor → Logs
```

**Metrics**:
1. Lambda Function → Monitor tab
2. View: Duration, Errors, Throttles, Invocations
3. Set alarms if needed

**X-Ray Tracing**:
```python
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

@app.post("/speech-to-text")
@xray_recorder.capture("transcribe")
async def transcribe(file: UploadFile):
    # ...
```

---

## Cost Estimation

### Frontend (Vercel)
- **Free tier**: ∞ deployments, 100 GB bandwidth/month
- **Pro tier** ($20/month): If needed
- **Estimate for hackathon**: $0

### API (AWS Lambda)
- **Free tier**: 1M requests/month, 400,000 GB-seconds
- **Pay-as-you-go**: $0.0000002 per request, $0.0000166667 per GB-second
- **Estimate**: $0-5/month (depending on usage)

### OpenAI
- **Whisper API**: $0.02 per minute of audio
- **Estimate**: $1-10/month for hackathon usage

**Total estimated cost**: $0-15/month

---

## Scaling

### Horizontal Scaling

**Frontend (Vercel)**:
- Automatic (CDN, edge functions)
- No configuration needed

**API (AWS Lambda)**:
```python
# Lambda auto-scales (no configuration needed)
# But monitor:
# - Reserved Concurrency (default: unlimited)
# - Request rate limit (1000/s)
# - Payload size (10 MB, binary)
```

If hitting limits:
1. Set Reserved Concurrency
2. Use API Gateway throttling
3. Consider RDS Proxy for database

### Vertical Scaling

**Lambda Memory**:
```bash
aws lambda update-function-configuration \
  --function-name platanus-sst-api \
  --memory-size 1024  # Increase from 512
```

More memory = more CPU = faster processing

**Timeout**:
```bash
aws lambda update-function-configuration \
  --function-name platanus-sst-api \
  --timeout 300  # 5 minutes (max)
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Frontend
        uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/fe-webapp

  api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy API
        uses: serverless/github-action@master
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        with:
          args: deploy
          working-directory: apis/api-sst
```

Setup GitHub Secrets:
1. Repository → Settings → Secrets → New repository secret
2. Add required secrets (tokens, keys)

---

## Rollback Procedure

### Frontend (Vercel)

**Instant Rollback**:
1. Vercel Dashboard → Deployments
2. Select previous deployment
3. Click "Promote to Production"

**Takes**: < 10 seconds

### API (AWS Lambda)

**Using Aliases**:
```bash
# Create alias pointing to version
aws lambda create-alias \
  --function-name platanus-sst-api \
  --name prod \
  --function-version 5  # Previous stable version

# Rollback by updating alias
aws lambda update-alias \
  --function-name platanus-sst-api \
  --name prod \
  --function-version 4  # Earlier version
```

**Takes**: < 1 second

---

## Security Checklist

### Frontend
- ✅ HTTPS only (Vercel automatic)
- ✅ No secrets in code
- ✅ Environment variables for API URL
- ✅ CORS configured
- ✅ CSP headers (optional)

### API
- ✅ OPENAI_API_KEY in Lambda environment
- ✅ Not in code or git
- ✅ IAM role with minimal permissions
- ✅ File upload validation
- ✅ Rate limiting (optional)

### After Deployment
1. Change any default credentials
2. Enable CloudWatch alarms
3. Setup error notifications
4. Regular log review
5. Keep dependencies updated

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend 404 errors | Check root directory in Vercel settings |
| API CORS errors | Add CORSMiddleware to FastAPI |
| Lambda timeout | Increase timeout, memory, or optimize code |
| Function size too large | Remove dependencies, use layer for libraries |
| API key errors | Verify env var in Lambda configuration |
| Cold start slow | Increase memory (more CPU) or use provisioned concurrency |
| High costs | Monitor invocations, check for loops, set concurrency limits |

---

## Post-Deployment

### Setup Monitoring
- [ ] CloudWatch alarms for Lambda errors
- [ ] Vercel analytics dashboard
- [ ] OpenAI usage dashboard
- [ ] Sentry error tracking (optional)

### Setup Logging
- [ ] CloudWatch Logs for API
- [ ] Structured logging format
- [ ] Log retention policies (14 days recommended)

### Optimize
- [ ] Review cold start times
- [ ] Monitor API response times
- [ ] Check Lambda memory usage
- [ ] Analyze frontend Core Web Vitals

### Document
- [ ] Document API endpoint URL
- [ ] Document admin procedures
- [ ] Create runbook for common issues
- [ ] Setup on-call rotation (if team)

---

## Rollback to Local

If everything fails:

```bash
# Stop remote services
# Stop Lambda function, unpublish from Vercel

# Run locally
cd apps/fe-webapp && npm run dev  # Terminal 1
cd apis/api-sst && ./dev.sh       # Terminal 2

# Access at http://localhost:3000
```

---

## Next Steps

1. ✅ Create AWS account if not exists
2. ✅ Create Vercel account
3. ✅ Deploy frontend to Vercel
4. ✅ Deploy API to Lambda
5. ✅ Test end-to-end
6. ✅ Setup monitoring
7. ✅ Document URLs and credentials
8. ✅ Share with team/judges

---

**See Also**:
- `docs/INTEGRATION.md` - Connect frontend to API
- `docs/API.md` - API documentation
- `docs/FRONTEND.md` - Frontend documentation
