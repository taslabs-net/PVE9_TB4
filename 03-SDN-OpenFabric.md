---
layout: page
title: 'Step 3: SDN OpenFabric Configuration'
permalink: /sdn-openfabric/
nav_order: 5
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 2: Proxmox SDN OpenFabric Configuration

## Step 9: Create OpenFabric Fabric

**Use Proxmox GUI to create the OpenFabric mesh configuration.**

**Navigate:** Datacenter → SDN → Fabrics → Create

**Configuration:**

- **Fabric:** `tb4`
- **Type:** `openfabric`
- **IPv4 Prefix:** `10.100.0.0/24`
- **IPv6 Prefix:** (leave empty)
- **Click:** "Create"

## Step 10: Add Nodes to Fabric

**Add each mesh node to the fabric with router IDs and interfaces.**

**For n2:** Datacenter → SDN → Fabrics → tb4 → Nodes → Add

- **Node:** `n2`
- **IPv4:** `10.100.0.102`
- **IPv6:** (leave empty)
- **Interfaces:** Select `en05` and `en06` from the interface list

**For n3:** Repeat with:

- **IPv4:** `10.100.0.103`, interfaces: `en05, en06`

**For n4:** Repeat with:

- **IPv4:** `10.100.0.104`, interfaces: `en05, en06`

**Expected result:** You should see all 3 nodes listed under the fabric with their IPv4 addresses
and interfaces (`en05, en06` for each)

## Step 11: Apply SDN Configuration

**Apply the fabric configuration to all nodes.**

**Navigate:** Datacenter → SDN → Apply

**Or via CLI:**

```bash
# Apply SDN configuration from any node:
pvesdn commit
```

**CRITICAL:** The /30 point-to-point IP addresses configured in Step 4 are **REQUIRED** for the
cluster to function. Without these static IPs:

- Ceph OSDs will fail to start with "Cannot assign requested address" errors
- The cluster_network (10.100.0.0/24) won't be accessible
- OpenFabric can route between nodes, but Ceph needs actual IPs to bind to

The static IPs were already configured in Step 4 of the TB4 Foundation setup. Verify they're still
present:

```bash
# Verify IP assignments on all nodes:
for node in n2 n3 n4; do
  echo "=== $node TB4 IPs ==="
  ssh $node "ip addr show en05 | grep 'inet ' && ip addr show en06 | grep 'inet '"
done
```

**Expected output:**

```
n2: en05: 10.100.0.2/30   en06: 10.100.0.5/30
n3: en05: 10.100.0.6/30   en06: 10.100.0.9/30
n4: en05: 10.100.0.10/30  en06: 10.100.0.14/30
```

## Step 12: Start FRR Service

**Critical:** OpenFabric routing requires FRR (Free Range Routing) to be running.

```bash
# Start and enable FRR on all mesh nodes:
for node in n2 n3 n4; do
  ssh $node "systemctl start frr && systemctl enable frr"
done
```

**Verify FRR is running:**

```bash
for node in n2 n3 n4; do
  echo "=== FRR status on $node ==="
  ssh $node "systemctl status frr | grep -E '(Active|Main PID)'"
done
```

**Expected output:** `Active: active (running)` on all nodes.

## Verify OpenFabric Routing

After FRR starts, OpenFabric should establish routes between all nodes:

```bash
# Check routing table on each node:
for node in n2 n3 n4; do
  echo "=== OpenFabric routes on $node ==="
  ssh $node "ip route show | grep openfabric"
done
```

**Expected:** You should see routes to other nodes' router IDs (10.100.0.102-104) via the TB4
interfaces with "proto openfabric".
