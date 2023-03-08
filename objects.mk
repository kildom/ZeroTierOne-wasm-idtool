CORE_OBJS=\
	node/Identity.o \
	node/SHA512.o \
	node/Salsa20.o \
	node/C25519.o \
	node/Utils.o \

#\
	node/AES.o \
	node/AES_aesni.o \
	node/AES_armcrypto.o \
	node/Capability.o \
	node/CertificateOfMembership.o \
	node/CertificateOfOwnership.o \
	node/IncomingPacket.o \
	node/InetAddress.o \
	node/Membership.o \
	node/Multicaster.o \
	node/Network.o \
	node/NetworkConfig.o \
	node/Node.o \
	node/OutboundMulticast.o \
	node/Packet.o \
	node/Path.o \
	node/Peer.o \
	node/Poly1305.o \
	node/Revocation.o \
	node/SelfAwareness.o \
	node/Switch.o \
	node/Tag.o \
	node/Topology.o \
	node/Trace.o \
	node/Bond.o

ONE_OBJS=\


#\
	controller/EmbeddedNetworkController.o \
	controller/DBMirrorSet.o \
	controller/DB.o \
	controller/FileDB.o \
	controller/LFDB.o \
	controller/PostgreSQL.o \
	osdep/EthernetTap.o \
	osdep/ManagedRoute.o \
	osdep/Http.o \
	osdep/OSUtils.o \
	service/SoftwareUpdater.o \
	service/OneService.o

