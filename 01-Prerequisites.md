---
layout: page
title: 'Step 1: Prerequisites and Planning'
permalink: /prerequisites/
nav_order: 1
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 0: Prerequisites and Planning

## What You Need

### Physical Requirements

- **3 nodes minimum:** Each with dual TB4 ports (tested with MS01 mini-PCs)
- **TB4 cables:** Quality TB4 cables for mesh connectivity
- **Ring topology:** Physical connections n2→n3→n4→n2 (or similar mesh pattern)
- **Management network:** Standard Ethernet for initial setup and management

### Software Requirements

- **Proxmox VE 9.0.10** with native SDN OpenFabric support
- **SSH root access** to all nodes
- **Basic Linux networking** knowledge
- **Patience:** TB4 mesh setup requires careful attention to detail!

## SSH Key Setup

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

**Note:** Replace the example SSH key above with your actual public key content. You can view your
public key with:

```bash
cat ~/.ssh/id_ed25519.pub
```

## Network Architecture

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
- **OpenFabric Router IDs:** 10.100.0.102 (n2), 10.100.0.103 (n3), 10.100.0.104 (n4)

## Hardware Environment (Tested)

- **Nodes:** 3x systems with dual TB4 ports (tested on MS01 mini-PCs)
- **Memory:** 64GB+ RAM per node (optimal for high-performance Ceph)
- **CPU:** 13th Gen Intel (or equivalent high-performance processors)
- **Storage:** 2x NVMe drives per node for Ceph OSDs (6 OSDs total)
- **Network Architecture:**
  - **Cluster Management:** 10.11.11.0/24 - Proxmox cluster communication and SSH
  - **VM/Public Network:** 10.1.1.0/24 - VM traffic and Ceph public network (client I/O)
  - **Ceph Cluster Network (TB4):** 10.100.0.0/24 - OSD replication traffic only

## Expected Results

- **TB4 Mesh Performance:** Sub-millisecond latency, 65520 MTU, full mesh connectivity
- **Ceph Performance:** 1,300+ MB/s write, 1,760+ MB/s read with optimizations
- **Reliability:** 0% packet loss, automatic failover, persistent configuration
- **Integration:** Full Proxmox GUI visibility and management
