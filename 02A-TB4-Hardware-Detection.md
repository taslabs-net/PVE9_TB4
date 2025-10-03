---
layout: page
title: 'Step 2A: TB4 Hardware Detection'
permalink: /tb4-hardware-detection/
nav_order: 2
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 1A: TB4 Hardware Detection

This section covers the initial hardware detection and kernel module setup for Thunderbolt 4
interfaces.

## Step 1: Prepare All Nodes

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

## Step 2: Identify TB4 Hardware

**Find TB4 controllers and interfaces:**

```bash
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  echo "=== TB4 hardware on $node ==="
  ssh root@$node "lspci | grep -i thunderbolt"
  ssh root@$node "ip link show | grep -E '(en0[5-9]|thunderbolt)'"
done
```

**Expected:** TB4 PCI controllers detected, TB4 network interfaces visible.

## Step 3: Create Systemd Link Files

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

## Next Steps

After completing hardware detection, proceed to [TB4 Network
Configuration]({{ site.baseurl }}/tb4-network-configuration/) to configure the network interfaces
and systemd networking.
