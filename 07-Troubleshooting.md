---
layout: page
title: 'Reference: Troubleshooting'
permalink: /troubleshooting/
nav_order: 11
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Reference: Troubleshooting Common Issues

**Note:** This is a reference section. Consult as needed when encountering issues during any phase.

## TB4 Mesh Issues

### Problem: TB4 interfaces not coming up after reboot

**Symptoms:** Interfaces missing, mesh connectivity fails **Solution:** Manually bring up interfaces
and reapply SDN config:

```bash
# Solution: Manually bring up interfaces and reapply SDN config:
for node in n2 n3 n4; do
  ssh $node "ip link set en05 up mtu 65520"
  ssh $node "ip link set en06 up mtu 65520"
  ssh $node "ifreload -a"
done
```

### Problem: Mesh connectivity fails between some nodes

**Symptoms:** Some router IDs unreachable, packet loss **Diagnosis:**

```bash
# Check interface status:
for node in n2 n3 n4; do
  echo "=== $node TB4 status ==="
  ssh $node "ip addr show | grep -E '(en05|en06|10\.100\.0\.)'"
done

# Verify FRR routing service:
for node in n2 n3 n4; do
  ssh $node "systemctl status frr"
done

# Check OpenFabric routing:
for node in n2 n3 n4; do
  ssh $node "vtysh -c 'show openfabric topology'"
done
```

### Problem: Wrong interface names (not en05/en06)

**Cause:** PCI paths in systemd link files don't match hardware **Solution:** Update PCI paths in
link files:

```bash
# Check actual PCI paths:
for node in n2 n3 n4; do
  ssh $node "lspci | grep -i thunderbolt"
done

# Update link files with correct paths and reboot
```

## Ceph Issues

### Problem: OSDs going down after creation

**Root Cause:** Usually TB4 mesh network connectivity issues **Solution:** Fix TB4 mesh first, then
restart OSD services:

```bash
# First: Verify mesh connectivity (router ID pings)
for target in 10.100.0.12 10.100.0.13 10.100.0.14; do
  ssh n2 "ping -c 2 $target"
done

# Then: Restart OSD services after fixing mesh:
for node in n2 n3 n4; do
  ssh $node "systemctl restart ceph-osd@*.service"
done
```

### Problem: Inactive PGs or slow performance

**Symptoms:** HEALTH_WARN, slow I/O, PGs not active+clean **Diagnosis:**

```bash
# Check cluster status:
ssh n2 "ceph -s"
ssh n2 "ceph health detail"

# Verify optimizations are applied:
ssh n2 "ceph config dump | grep -E '(memory_target|cache_size|compression)'"

# Check network binding:
ssh n2 "ceph config get osd cluster_network"
ssh n2 "ceph config get osd public_network"
```

**Solution:** Usually requires PG count increase or network fixes:

```bash
# If PG count is too low:
ssh n2 "ceph osd pool set cephtb4 pg_num 256"
ssh n2 "ceph osd pool set cephtb4 pgp_num 256"

# If network binding issues:
ssh n2 "ceph config set global cluster_network 10.100.0.0/24"
ssh n2 "ceph config set global public_network 10.11.12.0/24"
```

### Problem: Proxmox GUI doesn't show OSDs

**Root Cause:** Config database synchronization issues **Solution:**

```bash
# Restart Ceph monitor services:
for node in n2 n3 n4; do
  ssh $node "systemctl restart ceph-mon@*.service"
done

# Wait and check GUI again
# Alternative: Check config database directly:
ssh n2 "ceph config dump"
```

### Problem: Authentication/keyring errors

**Symptoms:** Permission denied, authentication failed **Solution:** Verify keyring files and
permissions:

```bash
# Check keyring files exist:
ssh n2 "ls -la /etc/pve/priv/ceph*"

# Verify Ceph authentication:
ssh n2 "ceph auth list"

# If corrupted, may need to recreate admin keyring
```

## General Troubleshooting Commands

### Check overall system health:

```bash
# TB4 mesh status:
for node in n2 n3 n4; do
  echo "=== $node TB4 ==="
  ssh $node "ip addr show | grep 10.100.0"
done

# Ceph cluster status:
ssh n2 "ceph -s"
ssh n2 "ceph osd tree"
ssh n2 "ceph health detail"

# Service status:
for node in n2 n3 n4; do
  echo "=== $node services ==="
  ssh $node "systemctl is-active frr ceph-mon@* ceph-mgr@* ceph-osd@*"
done
```

### Log file locations:

- **TB4/FRR logs:** `/var/log/frr/`
- **Ceph logs:** `/var/log/ceph/`
- **Systemd logs:** `journalctl -u ceph-osd@X.service`
- **udev TB4 logs:** `/tmp/udev-debug.log`

### Performance debugging:

```bash
# Check if optimizations are active:
ssh n2 "ceph daemon osd.0 config show | grep -E '(memory|cache|compression)'"

# Monitor real-time performance:
ssh n2 "ceph -w"

# Check network utilization on TB4 interfaces:
for node in n2 n3 n4; do
  ssh $node "iftop -i en05"  # or en06
done
```

## Recovery Procedures

### Complete mesh restart (if needed):

```bash
# Restart everything in order:
for node in n2 n3 n4; do
  ssh $node "systemctl restart frr"
  sleep 5
done

pvesdn commit

for node in n2 n3 n4; do
  ssh $node "systemctl restart ceph-mon@*.service ceph-mgr@*.service"
  sleep 10
  ssh $node "systemctl restart ceph-osd@*.service"
  sleep 10
done
```

### Emergency access:

- **If SSH fails:** Use Proxmox node console
- **If mesh is down:** Use management network (10.11.12.x addresses)
- **If Ceph is corrupt:** Stop all Ceph services before diagnostics
