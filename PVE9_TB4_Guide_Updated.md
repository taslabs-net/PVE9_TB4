# PVE 9 BETA TB4 + Ceph Guide

**Updated as of: 2025-01-03** - Network architecture corrections applied

**For the best reading experience, visit the live documentation at: https://tb4.git.taslabs.net/**

---

## Network Architecture (UPDATED)

**Cluster Management Network:** `10.11.11.0/24` (vmbr0)

- **Primary cluster communication and SSH access**
- n2: 10.11.11.12
- n3: 10.11.11.13
- n4: 10.11.11.14

**VM Network and Backup Cluster Network:** `10.1.1.0/24` (vmbr1)

- VM traffic and backup cluster communication
- n2: 10.1.1.12
- n3: 10.1.1.13
- n4: 10.1.1.14

**TB4 Mesh Network:** `10.100.0.0/24` (en05/en06)

- **High-speed TB4 interfaces for Ceph cluster_network**
- Isolated from client I/O traffic
- Provides optimal performance for Ceph OSD communication

## SSH Key Setup (UPDATED)

**Critical:** Before proceeding with any configuration, you must set up SSH key authentication for
passwordless access to all nodes.

### Step 1: Generate SSH Key (if you don't have one)

```bash
# Generate a new SSH key (if needed):
ssh-keygen -t ed25519 -C "cluster-ssh-key" -f ~/.ssh/cluster_key
```

### Step 2: Accept Host Keys (First Time Only)

**IMPORTANT:** Before running the deployment commands, you must SSH into each node once to accept
the host key:

```bash
# Accept host keys for all nodes (type 'yes' when prompted):
ssh root@10.11.11.12 "echo 'Host key accepted for n2'"
ssh root@10.11.11.13 "echo 'Host key accepted for n3'"
ssh root@10.11.11.14 "echo 'Host key accepted for n4'"
```

**Note:** This step is required because the first SSH connection to each host requires accepting the
host key. Without this, the automated deployment commands will fail.

### Step 3: Deploy SSH Key to All Nodes

**Deploy your public key to each node's authorized_keys:**

```bash
# Deploy to n2 (10.11.11.12):
ssh root@10.11.11.12 "mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMGHoypdiKhldYlNUvW27uzutzewJ+X08Rlg/m7vmmtW cluster-ssh-key' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# Deploy to n3 (10.11.11.13):
ssh root@10.11.11.13 "mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMGHoypdiKhldYlNUvW27uzutzewJ+X08Rlg/m7vmmtW cluster-ssh-key' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# Deploy to n4 (10.11.11.14):
ssh root@10.11.11.14 "mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMGHoypdiKhldYlNUvW27uzutzewJ+X08Rlg/m7vmmtW cluster-ssh-key' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### Step 4: Test SSH Key Authentication

```bash
# Test passwordless SSH access to all nodes:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  echo "Testing SSH access to $node..."
  ssh root@$node "echo 'SSH key authentication working on $node'"
done
```

**Expected result:** All nodes should respond without prompting for a password.

## TB4 Hardware Detection (UPDATED)

### Step 1: Prepare All Nodes

**Critical:** Perform these steps on **ALL mesh nodes** (n2, n3, n4).

**Load TB4 kernel modules:**

```bash
# Execute on each node:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  ssh root@$node "echo 'thunderbolt' >> /etc/modules"
  ssh root@$node "echo 'thunderbolt-net' >> /etc/modules"
  ssh root@$node "modprobe thunderbolt && modprobe thunderbolt-net"
done
```

**Verify modules loaded:**

```bash
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  echo "=== TB4 modules on $node ==="
  ssh root@$node "lsmod | grep thunderbolt"
done
```

**Expected output:** Both `thunderbolt` and `thunderbolt_net` modules present.

### Step 2: Identify TB4 Hardware

**Find TB4 controllers and interfaces:**

```bash
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  echo "=== TB4 hardware on $node ==="
  ssh root@$node "lspci | grep -i thunderbolt"
  ssh root@$node "ip link show | grep -E '(en0[5-9]|thunderbolt)'"
done
```

**Expected:** TB4 PCI controllers detected, TB4 network interfaces visible.

### Step 3: Create Systemd Link Files

**Critical:** Create interface renaming rules based on PCI paths for consistent naming.

**For all nodes (n2, n3, n4):**

```bash
# Create systemd link files for TB4 interface renaming:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  ssh root@$node "cat > /etc/systemd/network/00-thunderbolt0.link << 'EOF'
[Match]
Path=pci-0000:00:0d.2
Driver=thunderbolt-net

[Link]
MACAddressPolicy=none
Name=en05
EOF"

  ssh root@$node "cat > /etc/systemd/network/00-thunderbolt1.link << 'EOF'
[Match]
Path=pci-0000:00:0d.3
Driver=thunderbolt-net

[Link]
MACAddressPolicy=none
Name=en06
EOF"
done
```

**Note:** Adjust PCI paths if different on your hardware (check with `lspci | grep -i thunderbolt`)

**Verification:** After creating the link files, reboot and verify:

```bash
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  echo "=== Interface names on $node ==="
  ssh root@$node "ip link show | grep -E '(en05|en06)'"
done
```

**Expected:** Both `en05` and `en06` interfaces should be present and properly named.

## TB4 Network Configuration (UPDATED)

### Step 4: Configure Network Interfaces

**CRITICAL:** TB4 interfaces MUST be defined **BEFORE** the `source /etc/network/interfaces.d/*`
line to prevent conflicts with SDN configuration.

**Manual configuration required for each node:**

Edit `/etc/network/interfaces` on each node and insert the following **BEFORE** the
`source /etc/network/interfaces.d/*` line:

```bash
# Add at the TOP of the file, right after the header comments:
iface en05 inet manual #do not edit in GUI
iface en06 inet manual #do not edit in GUI
```

Then add the full interface definitions **BEFORE** the `source` line:

```bash
# n2 configuration:
auto en05
iface en05 inet static
    address 10.100.0.2/30
    mtu 65520

auto en06
iface en06 inet static
    address 10.100.0.5/30
    mtu 65520

# n3 configuration:
auto en05
iface en05 inet static
    address 10.100.0.6/30
    mtu 65520

auto en06
iface en06 inet static
    address 10.100.0.9/30
    mtu 65520

# n4 configuration:
auto en05
iface en05 inet static
    address 10.100.0.10/30
    mtu 65520

auto en06
iface en06 inet static
    address 10.100.0.14/30
    mtu 65520
```

**IMPORTANT:**

- The `auto` keyword is **CRITICAL** - without it, interfaces won't come up automatically at boot
- These static IP addresses are **REQUIRED** for Ceph's cluster_network
- Without the IPs, OSDs will fail to start with "Cannot assign requested address" errors

### Step 5: Enable systemd-networkd

**Required for systemd link files to work:**

```bash
# Enable and start systemd-networkd on all nodes:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  ssh root@$node "systemctl enable systemd-networkd && systemctl start systemd-networkd"
done
```

### Step 6: Create Udev Rules and Scripts

**Automation for reliable interface bringup on cable insertion:**

**Create udev rules:**

```bash
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  ssh root@$node "cat > /etc/udev/rules.d/10-tb-en.rules << 'EOF'
ACTION==\"move\", SUBSYSTEM==\"net\", KERNEL==\"en05\", RUN+=\"/usr/local/bin/pve-en05.sh\"
ACTION==\"move\", SUBSYSTEM==\"net\", KERNEL==\"en06\", RUN+=\"/usr/local/bin/pve-en06.sh\"
EOF"
done
```

**Create interface bringup scripts:**

```bash
# Create en05 bringup script for all nodes:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  ssh root@$node "cat > /usr/local/bin/pve-en05.sh << 'EOF'
#!/bin/bash
LOGFILE=\"/tmp/udev-debug.log\"
echo \"\$(date): en05 bringup triggered\" >> \"\$LOGFILE\"
for i in {1..5}; do
    {
        ip link set en05 up mtu 65520
        echo \"\$(date): en05 up successful on attempt \$i\" >> \"\$LOGFILE\"
        break
    } || {
        echo \"\$(date): Attempt \$i failed, retrying in 3 seconds...\" >> \"\$LOGFILE\"
        sleep 3
    }
done
EOF"
  ssh root@$node "chmod +x /usr/local/bin/pve-en05.sh"
done

# Create en06 bringup script for all nodes:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  ssh root@$node "cat > /usr/local/bin/pve-en06.sh << 'EOF'
#!/bin/bash
LOGFILE=\"/tmp/udev-debug.log\"
echo \"\$(date): en06 bringup triggered\" >> \"\$LOGFILE\"
for i in {1..5}; do
    {
        ip link set en06 up mtu 65520
        echo \"\$(date): en06 up successful on attempt \$i\" >> \"\$LOGFILE\"
        break
    } || {
        echo \"\$(date): Attempt \$i failed, retrying in 3 seconds...\" >> \"\$LOGFILE\"
        sleep 3
    }
done
EOF"
  ssh root@$node "chmod +x /usr/local/bin/pve-en06.sh"
done
```

### Step 7: Verify Network Configuration

**Test TB4 network connectivity:**

```bash
# Test connectivity between nodes:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  echo "=== Testing TB4 connectivity from $node ==="
  ssh root@$node "ping -c 2 10.100.0.2 && ping -c 2 10.100.0.6 && ping -c 2 10.100.0.10"
done
```

**Expected:** All ping tests should succeed, confirming TB4 mesh connectivity.

**Verify interface status:**

```bash
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  echo "=== TB4 interface status on $node ==="
  ssh root@$node "ip addr show en05 en06"
done
```

**Expected:** Both interfaces should show `UP` state with correct IP addresses.

## Key Updates Made

1. **SSH Access Network:** Changed from `10.1.1.x` to `10.11.11.x` (cluster management network)
2. **Network Architecture:** Added clear explanation of the three network segments
3. **All SSH Commands:** Updated to use correct cluster management network
4. **Verification Steps:** Enhanced with better testing and troubleshooting

## Network Summary

- **10.11.11.0/24** = Cluster Management Network (vmbr0) - SSH access and cluster communication
- **10.1.1.0/24** = VM Network and Backup Cluster Network (vmbr1) - VM traffic
- **10.100.0.0/24** = TB4 Mesh Network (en05/en06) - Ceph cluster_network for optimal performance

This updated version ensures all commands use the proper network architecture for your cluster
setup.

---

**For the complete guide with all phases, troubleshooting, and the best reading experience, visit:
https://tb4.git.taslabs.net/**
