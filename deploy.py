import os
import sys
from ftplib import FTP, error_perm

# Reconfigure stdout for unicode on Windows terminal if needed
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load .env file
def load_env(env_path='.env'):
    env_vars = {}
    if not os.path.exists(env_path):
        print(f"Error: {env_path} file not found.")
        sys.exit(1)
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip().strip("'\"")
    return env_vars

IGNORED_ITEMS = {
    '.git',
    '.vscode',
    '.env',
    '.env.example',
    '.gitignore',
    'deploy.py',
    'deploy.js',
    'node_modules',
    'package.json',
    'package-lock.json'
}

def safe_print(msg):
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode('ascii', errors='ignore').decode('ascii'))

def ensure_remote_dir(ftp, remote_dir):
    """Ensure directory structure exists on remote FTP server."""
    dirs = remote_dir.strip('/').split('/')
    current_path = ''
    for d in dirs:
        if not d:
            continue
        current_path += '/' + d
        try:
            ftp.cwd(current_path)
        except error_perm:
            try:
                ftp.mkd(current_path)
                safe_print(f"[+] Created remote directory: {current_path}")
                ftp.cwd(current_path)
            except error_perm as e:
                safe_print(f"[!] Warning creating directory {current_path}: {e}")

def upload_files():
    env = load_env()
    host = env.get('FTP_HOST', 'ftpupload.net')
    user = env.get('FTP_USER')
    password = env.get('FTP_PASS')
    port = int(env.get('FTP_PORT', 21))
    remote_root = env.get('FTP_REMOTE_DIR', '/htdocs')

    safe_print(f"[*] Connecting to FTP server: {host}:{port} as user '{user}'...")

    try:
        ftp = FTP()
        ftp.connect(host, port, timeout=30)
        ftp.login(user, password)
        safe_print("[+] Connected & Authenticated successfully!\n")

        # Navigate to target remote root
        ensure_remote_dir(ftp, remote_root)
        ftp.cwd(remote_root)
        safe_print(f"[*] Current remote path: {ftp.pwd()}\n")

        local_root = os.getcwd()
        uploaded_count = 0

        for root, dirs, files in os.walk(local_root):
            # Exclude ignored directories in-place
            dirs[:] = [d for d in dirs if d not in IGNORED_ITEMS]

            rel_path = os.path.relpath(root, local_root)
            if rel_path == '.':
                remote_dir = remote_root
            else:
                remote_dir = remote_root + '/' + rel_path.replace('\\', '/')

            ensure_remote_dir(ftp, remote_dir)

            for file_name in files:
                if file_name in IGNORED_ITEMS or file_name.endswith('.pyc') or file_name.endswith('.log'):
                    continue

                local_file_path = os.path.join(root, file_name)
                remote_file_path = remote_dir + '/' + file_name

                safe_print(f"[^] Uploading: {os.path.relpath(local_file_path, local_root)} -> {remote_file_path}")
                
                with open(local_file_path, 'rb') as f:
                    ftp.storbinary(f'STOR {file_name}', f)
                
                uploaded_count += 1

        ftp.quit()
        safe_print(f"\n[SUCCESS] Deployment completed successfully! Total {uploaded_count} files uploaded to InfinityFree.")

    except Exception as e:
        safe_print(f"\n[ERROR] Deployment failed with error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    upload_files()
