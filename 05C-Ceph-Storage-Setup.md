---
layout: page
title: 'Step 5C: Ceph Storage Setup'
permalink: /ceph-storage-setup/
nav_order: 9
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 4C: Ceph Storage Setup

This section covers the creation of OSDs, storage pools, and Proxmox integration.

## Step 22: Create OSDs

**Create 2 OSDs per mesh node using NVMe drives:**

**Via Proxmox GUI:**

- **n2:** n2 node → Ceph → OSD → "Create: OSD" → Select NVMe drive → "Create"
- **Repeat:** Create second OSD on n2's second NVMe drive
- **n3:** Repeat process for both NVMe drives on n3
- **n4:** Repeat process for both NVMe drives on n4

**Or via CLI:**

```bash
# Create OSDs (adjust device paths as needed):
for node in n2 n3 n4; do
  echo "=== Creating OSDs on $node ==="
  ssh $node "pveceph osd create /dev/nvme0n1"
  ssh $node "pveceph osd create /dev/nvme1n1"
done
```

**Verify all OSDs are up:**

```bash
ssh n2 "ceph osd tree"
ssh n2 "ceph -s"
```

**Expected:** 6 osds: 6 up, 6 in

**Verify OSDs are using TB4 cluster_network:**

```bash
# Check OSD network bindings:
ssh n2 "ceph osd find 0"
```

**Expected:** OSD addresses should show cluster_network on 10.100.0.x (TB4) and public on 10.1.1.x

## Step 23: Create Storage Pool

**Create optimized storage pool with proper PG count:**

```bash
# Create pool with optimal PG count for 6 OSDs (256 PGs = ~128 PGs per OSD):
ssh n2 "ceph osd pool create cephtb4 256 256"

# Set 3:2 replication ratio (size=3, min_size=2) for production:
ssh n2 "ceph osd pool set cephtb4 size 3"
ssh n2 "ceph osd pool set cephtb4 min_size 2"

# Enable RBD application for Proxmox integration:
ssh n2 "ceph osd pool application enable cephtb4 rbd"
```

## Step 24: Add to Proxmox Storage

**Configure pool for Proxmox use:**

**Via Proxmox GUI:**

- **Navigate:** Datacenter → Storage → Add → RBD
- **ID:** `cephtb4`
- **Pool:** `cephtb4`
- **Monitor hosts:** `10.1.1.12,10.1.1.13,10.1.1.14` (public network IPs)
- **Username:** `admin`
- **Content:** Enable VM disks, container volumes as needed
- **Click:** "Add"

**IMPORTANT:** Use public network IPs (10.1.1.x) for monitor hosts because:

- 10.1.1.0/24 serves as both VM network and Ceph public network
- All Proxmox nodes (Ceph and non-Ceph) can access storage via this network
- VMs/CTs perform I/O via this same network
- TB4 cluster_network (10.100.0.0/24) remains dedicated to OSD replication only

**Verify Cluster Health:**

```bash
ssh n2 "ceph -s"
```

**Expected results:**

- **Health:** HEALTH_OK (or HEALTH_WARN with minor warnings)
- **OSDs:** 6 osds: 6 up, 6 in
- **PGs:** All PGs active+clean
- **Pools:** cephtb4 pool created and ready

**Verify network separation is working:**

```bash
# Check that OSDs are communicating over TB4:
ssh n2 "ceph daemon osd.0 config show | grep cluster_network"
```

**Expected:** Should show `10.100.0.0/24` (TB4 network)

## Next Steps

After completing Ceph storage setup, proceed to [Performance
Optimization]({{ site.baseurl }}/performance-optimization/) to apply high-performance tuning and
optimizations.
