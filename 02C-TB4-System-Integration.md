---
layout: page
title: 'Step 2C: TB4 System Integration'
permalink: /tb4-system-integration/
nav_order: 4
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 1C: TB4 System Integration

This section covers the final system integration steps for Thunderbolt 4, including initramfs
updates and system configuration.

## Step 7: Update Initramfs and Reboot

**Apply all TB4 configuration changes:**

```bash
# Update initramfs on all nodes:
for node in n2 n3 n4; do
  ssh $node "update-initramfs -u -k all"
done

# Reboot all nodes to apply changes:
echo "Rebooting all nodes - wait for them to come back online..."
for node in n2 n3 n4; do
  ssh $node "reboot"
done

# Wait and verify after reboot:
echo "Waiting 60 seconds for nodes to reboot..."
sleep 60

# Verify TB4 interfaces after reboot:
for node in n2 n3 n4; do
  echo "=== TB4 interfaces on $node after reboot ==="
  ssh $node "ip link show | grep -E '(en05|en06)'"
  ssh $node "ip addr show en05 | grep 'inet '"
  ssh $node "ip addr show en06 | grep 'inet '"
done
```

**Expected result:** TB4 interfaces should be named `en05` and `en06` with proper MTU settings and
static IP addresses assigned.

## Step 8: Enable IPv4 Forwarding

**Essential:** TB4 mesh requires IPv4 forwarding for OpenFabric routing.

```bash
# Configure IPv4 forwarding on all nodes:
for node in n2 n3 n4; do
  ssh $node "echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf"
  ssh $node "sysctl -p"
done
```

**Verify forwarding enabled:**

```bash
for node in n2 n3 n4; do
  echo "=== IPv4 forwarding on $node ==="
  ssh $node "sysctl net.ipv4.ip_forward"
done
```

**Expected output:** `net.ipv4.ip_forward = 1` on all nodes.

## TB4 Physical Topology

The 3-node mesh uses a triangle topology with the following connections:

```
n2 en06 (10.100.0.5/30)  ←→  n3 en05 (10.100.0.6/30)   [subnet: 10.100.0.4/30]
n3 en06 (10.100.0.9/30)  ←→  n4 en05 (10.100.0.10/30)  [subnet: 10.100.0.8/30]
n4 en06 (10.100.0.14/30) ←→  n2 en05 (10.100.0.2/30)   [cross-subnet link]
```

This creates a redundant triangle mesh where each node has two paths to every other node.

## Next Steps

After completing TB4 system integration, proceed to [SDN OpenFabric
Configuration]({{ site.baseurl }}/sdn-openfabric/) to set up the Proxmox SDN fabric for mesh
routing.
