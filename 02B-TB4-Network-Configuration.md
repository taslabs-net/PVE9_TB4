---
layout: page
title: 'Step 2B: TB4 Network Configuration'
permalink: /tb4-network-configuration/
nav_order: 3
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 1B: TB4 Network Configuration

This section covers the network interface configuration and systemd networking setup for
Thunderbolt 4.

## Step 4: Configure Network Interfaces

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

## Step 5: Enable systemd-networkd

**Required for systemd link files to work:**

```bash
# Enable and start systemd-networkd on all nodes:
for node in 10.11.11.12 10.11.11.13 10.11.11.14; do
  ssh root@$node "systemctl enable systemd-networkd && systemctl start systemd-networkd"
done
```

## Step 6: Create Udev Rules and Scripts

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

## Step 7: Verify Network Configuration

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
  ssh root@$node 'for i in en05 en06; do ip addr show "$i"; done'
done
```

**Expected:** Both interfaces should show `UP` state with correct IP addresses.

## Next Steps

After completing network configuration, proceed to [TB4 System
Integration]({{ site.baseurl }}/tb4-system-integration/) to finalize the TB4 setup with initramfs
updates and system configuration.
