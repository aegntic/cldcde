#!/bin/bash
set -e

echo "Firebase Studio & Google Cloud SDK Setup"
echo "========================================"

# Check for existing installations
echo "Checking existing installations..."

if command -v firebase >/dev/null 2>&1; then
  FIREBASE_VERSION=$(firebase --version | head -n 1)
  echo "✓ Firebase CLI already installed: $FIREBASE_VERSION"
  FIREBASE_INSTALLED=true
else
  echo "✗ Firebase CLI not found"
  FIREBASE_INSTALLED=false
fi

if command -v gcloud >/dev/null 2>&1; then
  GCLOUD_VERSION=$(gcloud --version | head -n 1)
  echo "✓ Google Cloud SDK already installed: $GCLOUD_VERSION"
  GCLOUD_INSTALLED=true
else
  echo "✗ Google Cloud SDK not found"
  GCLOUD_INSTALLED=false
fi

# Installation section
echo
echo "Installation options:"
echo "---------------------"

if [ "$FIREBASE_INSTALLED" = false ]; then
  read -p "Install Firebase CLI? [Y/n]: " INSTALL_FIREBASE
  INSTALL_FIREBASE=${INSTALL_FIREBASE:-Y}
  if [[ $INSTALL_FIREBASE =~ ^[Yy]$ ]]; then
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
    echo "✓ Firebase CLI installed"
  fi
fi

if [ "$GCLOUD_INSTALLED" = false ]; then
  read -p "Install Google Cloud SDK? [Y/n]: " INSTALL_GCLOUD
  INSTALL_GCLOUD=${INSTALL_GCLOUD:-Y}
  if [[ $INSTALL_GCLOUD =~ ^[Yy]$ ]]; then
    echo "Installing Google Cloud SDK..."
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Download and extract
    curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-latest-linux-x86_64.tar.gz
    tar -xf google-cloud-cli-latest-linux-x86_64.tar.gz
    
    # Run installer
    ./google-cloud-sdk/install.sh --quiet --usage-reporting=false
    
    # Add to PATH if not already present
    if ! grep -q "google-cloud-sdk/bin" ~/.bashrc; then
      echo 'export PATH="$HOME/google-cloud-sdk/bin:$PATH"' >> ~/.bashrc
    fi
    
    echo "✓ Google Cloud SDK installed"
    echo "NOTE: You may need to restart your terminal or run 'source ~/.bashrc' to use gcloud"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
  fi
fi

# Configuration
echo
echo "Configuration:"
echo "-------------"

# Firebase login
if command -v firebase >/dev/null 2>&1; then
  read -p "Configure Firebase CLI login? [Y/n]: " FIREBASE_LOGIN
  FIREBASE_LOGIN=${FIREBASE_LOGIN:-Y}
  if [[ $FIREBASE_LOGIN =~ ^[Yy]$ ]]; then
    firebase login
  fi
fi

# gcloud login
if command -v gcloud >/dev/null 2>&1; then
  read -p "Configure Google Cloud SDK login? [Y/n]: " GCLOUD_LOGIN
  GCLOUD_LOGIN=${GCLOUD_LOGIN:-Y}
  if [[ $GCLOUD_LOGIN =~ ^[Yy]$ ]]; then
    gcloud auth login
  fi
fi

# Create service account example if it doesn't exist
if [ ! -f "./service-account-example.json" ]; then
  echo '{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-client-email@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-client-email%40your-project-id.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}' > "./service-account-example.json"
  echo "✓ Created service-account-example.json template"
fi

echo
echo "Setup Complete!"
echo "---------------"
echo "Firebase Studio MCP Server has been configured."
echo
echo "Next Steps:"
echo "1. Start the server: npm start"
echo "2. Connect to the MCP server at http://localhost:3000"
echo "3. For Firebase Admin SDK features, replace service-account-example.json with your project's service account key"
