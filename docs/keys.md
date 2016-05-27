Create keys using elliptic curve encryption. Note: I'm using the built-in
secp521r1 curve but you could use a different one if you like. To get a list of
available curves, enter `openssl ecparam -list_curves`

generate private/public key pair:
`openssl ecparam -name secp384r1 -genkey -noout -out private.pem`

openssl ecparam -genkey -name secp384r1 -noout -out ec384-key-pair.pem

save public key to its own file (for distribution):
`openssl ec -in private.pem -out public.pem -pubout`
