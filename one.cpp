/*
 * Copyright (c)2020 ZeroTier, Inc.
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file in the project's root directory.
 *
 * Change Date: 2025-01-01
 *
 * On the date above, in accordance with the Business Source License, use
 * of this software will be governed by version 2.0 of the Apache License.
 */
/****/

#ifndef _GNU_SOURCE
#define _GNU_SOURCE
#endif

#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>
#include <errno.h>

#include "node/Constants.hpp"

#ifdef __WINDOWS__
#include <winsock2.h>
#include <windows.h>
#include <tchar.h>
#include <wchar.h>
#include <lmcons.h>
#include <newdev.h>
#include <atlbase.h>
#include <iphlpapi.h>
#include <iomanip>
#include <shlobj.h>
#include "osdep/WindowsEthernetTap.hpp"
#include "windows/ZeroTierOne/ServiceInstaller.h"
#include "windows/ZeroTierOne/ServiceBase.h"
#include "windows/ZeroTierOne/ZeroTierOneService.h"
#else
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/uio.h>
#include <dirent.h>
#ifdef __LINUX__
#include <sys/prctl.h>
#include <sys/syscall.h>
#include <sys/wait.h>
#include <net/if.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <ifaddrs.h>
#include <sys/ioctl.h>
#ifndef ZT_NO_CAPABILITIES
#include <linux/capability.h>
#include <linux/securebits.h>
#endif
#endif
#endif

#include <string>
#include <stdexcept>
#include <iostream>
#include <sstream>
#include <algorithm>

#include "version.h"
#include "include/ZeroTierOne.h"

#include "node/Identity.hpp"

#include <nlohmann/json.hpp>


using namespace ZeroTier;

#define PROGRAM_NAME "ZeroTier One"
#define COPYRIGHT_NOTICE "Copyright (c) 2020 ZeroTier, Inc."
#define LICENSE_GRANT "Licensed under the ZeroTier BSL 1.1 (see LICENSE.txt)"

#define WASM_EXPORT(name) \
    __attribute__((used)) \
    __attribute__((export_name(#name)))

#define WASM_IMPORT(name) \
    __attribute__((used)) \
    __attribute__((import_name(#name)))


struct OSUtils {

	static inline bool writeFile(const char *path,const std::string &s) {
		return true;
	}

};


WASM_IMPORT(getVanity)
const char* getVanity();

WASM_IMPORT(updateVanity)
int updateVanity(int counter, uint64_t address, int bits, uint64_t expected);

WASM_IMPORT(setPrivate)
void setPrivate(uint64_t address, const char *value, int length);

WASM_IMPORT(setPublic)
void setPublic(uint64_t address, const char *value, int length);

#define printf(...) do { sprintf(printf_buf, __VA_ARGS__); _print(printf_buf); } while (0)
#define fprintf(file, ...) printf(__VA_ARGS__)

WASM_EXPORT(main)
int main()
{
	Identity id;

	uint64_t vanity = 0;
	int vanityBits = 0;
	if (getVanity()) {
		vanity = Utils::hexStrToU64(getVanity()) & 0xffffffffffULL;
		vanityBits = 4 * (int)strlen(getVanity());
		if (vanityBits > 40)
			vanityBits = 40;
		if (vanityBits == 0) {
			vanityBits = 40;
			vanity = 0x1ffffffffffULL;
		}
		for(int i = 0;; i++) {
			id.generate();
			if ((id.address().toInt() >> (40 - vanityBits)) == vanity) {
				break;
			} else {
				if (updateVanity(i, id.address().toInt(), vanityBits, (vanity << (40 - vanityBits)) & 0xffffffffffULL)) {
					break;
				}
			}
		}
	} else {
		id.generate();
	}

	char idtmp[1024];
	std::string idser = id.toString(true,idtmp);
	setPrivate(id.address().toInt(), idser.c_str(), idser.length());
	idser = id.toString(false,idtmp);
	setPublic(id.address().toInt(), idser.c_str(), idser.length());
}
