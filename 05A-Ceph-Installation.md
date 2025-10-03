---
layout: page
title: 'Step 5A: Ceph Installation'
permalink: /ceph-installation/
nav_order: 7
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 4A: Ceph Installation

This section covers the initial Ceph installation and first monitor setup.

## Network Architecture Overview

**Critical Understanding:** This setup uses three separate networks for optimal performance and
isolation:

- **Cluster Management Network:** `10.11.11.0/24`
  - Proxmox cluster communication (corosync)
  - SSH access for administration
  - Standard Ethernet connection

- **VM/Public Network:** `10.1.1.0/24`
  - VM network traffic (general VM/CT networking)
  - Ceph public network (client I/O for disk operations)
  - Accessible by all Proxmox nodes and VMs
  - Allows non-Ceph nodes to access Ceph storage

- **Ceph Cluster Network (TB4):** `10.100.0.0/24`
  - OSD-to-OSD replication and backfill traffic ONLY
  - High-speed, low-latency TB4 mesh (40Gbps per link)
  - Only accessible between Ceph nodes (n2, n3, n4)

**Benefits of this three-network design:**

- OSD replication traffic isolated on dedicated TB4 mesh
- Client I/O and VM traffic share 10.1.1.0/24 without impacting OSD replication
- Proxmox cluster communication separate from storage traffic
- TB4 bandwidth fully dedicated to high-speed data movement between OSDs
- Better performance isolation and troubleshooting

## Step 17: Install Ceph on All Mesh Nodes

**Install Ceph packages on all mesh nodes:**

```bash
# Initialize Ceph on mesh nodes:
for node in n2 n3 n4; do
  echo "=== Installing Ceph on $node ==="
  ssh $node "pveceph install --repository test"
done
```

## Step 18: Create Ceph Directory Structure

**Essential:** Proper directory structure and ownership:

```bash
# Create base Ceph directories with correct ownership:
for node in n2 n3 n4; do
  echo "=== Creating Ceph directories on $node ==="
  ssh $node "
    mkdir -p /var/lib/ceph
    chown ceph:ceph /var/lib/ceph
    mkdir -p /var/lib/ceph/{mon,mgr,osd}
    chown ceph:ceph /var/lib/ceph/{mon,mgr,osd}
  "
done
```

## Step 19: Initialize First Monitor and Manager

**Create initial Ceph cluster on n2:**

**Via Proxmox GUI:**

- **Navigate:** n2 node → Ceph → Monitor → "Create"
- **Result:** First monitor and manager created, cluster FSID generated

**Or via CLI:**

```bash
# Initialize cluster with separated networks:
# --network = public network (10.1.1.0/24: VM traffic + Ceph client I/O)
# --cluster-network = TB4 mesh (10.100.0.0/24: OSD replication only)
ssh n2 "pveceph init --network 10.1.1.0/24 --cluster-network 10.100.0.0/24"
ssh n2 "pveceph mon create"
ssh n2 "pveceph mgr create"
```

**Verify initial cluster:**

```bash
ssh n2 "ceph -s"
```

**Expected output:**

```
cluster:
  id:     [cluster-fsid]
  health: HEALTH_OK

services:
  mon: 1 daemons, quorum n2 (age [time])
  mgr: n2(active, since [time])
  osd: 0 osds: 0 up, 0 in

data:
  pools:   0 pools, 0 pgs
  objects: 0 objects, 0 B
  usage:   0 B used, 0 B / 0 B avail
  pgs:
```

## Next Steps

After completing the initial Ceph installation, proceed to [Ceph Network
Configuration]({{ site.baseurl }}/ceph-network-configuration/) to configure the network settings and
create additional monitors.
