---
layout: page
title: 'Step 5B: Ceph Network Configuration'
permalink: /ceph-network-configuration/
nav_order: 8
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 4B: Ceph Network Configuration

This section covers the network configuration and additional monitor setup for high availability.

## Step 20: Configure Network Settings

**Set public and cluster networks for optimal TB4 performance:**

```bash
# Configure Ceph networks:
# Public network = 10.1.1.0/24 (VM traffic + Ceph client I/O)
# Cluster network = 10.100.0.0/24 (TB4 mesh for OSD replication only)
ssh n2 "ceph config set global public_network 10.1.1.0/24"
ssh n2 "ceph config set global cluster_network 10.100.0.0/24"

# Configure monitor networks:
ssh n2 "ceph config set mon public_network 10.1.1.0/24"
```

**Verify network configuration:**

```bash
ssh n2 "ceph config dump | grep network"
```

**Expected output:**

```
global   public_network   10.1.1.0/24
global   cluster_network  10.100.0.0/24
mon      public_network   10.1.1.0/24
```

## Step 21: Create Additional Monitors and Managers

**Add monitors and managers on n3 and n4 for high availability:**

**Via Proxmox GUI:**

- **n3:** n3 node → Ceph → Monitor → "Create"
- **n3:** n3 node → Ceph → Manager → "Create"
- **n4:** n4 node → Ceph → Monitor → "Create"
- **n4:** n4 node → Ceph → Manager → "Create"
- **Result:** Green success messages on all nodes

**Or via CLI:**

```bash
# Create monitors and managers on n3 and n4:
ssh n3 "pveceph mon create"
ssh n3 "pveceph mgr create"
ssh n4 "pveceph mon create"
ssh n4 "pveceph mgr create"
```

**Verify 3-monitor quorum and manager HA:**

```bash
ssh n2 "ceph quorum_status"
ssh n2 "ceph -s | grep mgr"
```

**Expected output:**

```
mon: 3 daemons, quorum n2,n3,n4
mgr: n2(active, since [time]), standbys: n3, n4
```

## Next Steps

After completing network configuration and monitor setup, proceed to [Ceph Storage
Setup]({{ site.baseurl }}/ceph-storage-setup/) to create OSDs and storage pools.
