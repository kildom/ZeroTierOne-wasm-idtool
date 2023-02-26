// (c) 2020-2022 ZeroTier, Inc. -- currently proprietary pending actual release and licensing. See LICENSE.md.
pub use openssl::aes;
pub use openssl::hash;
pub use openssl::p384;
pub use openssl::random;
pub use openssl::secret;
pub use openssl::aes_gmac_siv;

pub mod poly1305;
pub mod salsa;
pub mod typestate;
pub mod x25519;

/// Constant time byte slice equality.
#[inline]
pub fn secure_eq<A: AsRef<[u8]> + ?Sized, B: AsRef<[u8]> + ?Sized>(a: &A, b: &B) -> bool {
    let (a, b) = (a.as_ref(), b.as_ref());
    if a.len() == b.len() {
        let mut x = 0u8;
        for (aa, bb) in a.iter().zip(b.iter()) {
            x |= *aa ^ *bb;
        }
        x == 0
    } else {
        false
    }
}

extern "C" {
    fn OPENSSL_cleanse(ptr: *mut std::ffi::c_void, len: usize);
}

/// Destroy the contents of some memory
#[inline(always)]
pub fn burn(b: &mut [u8]) {
    unsafe { OPENSSL_cleanse(b.as_mut_ptr().cast(), b.len()) };
}
