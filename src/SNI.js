"use strict";

var core = require('./jscore');

var SNI = module.exports = {

	NotTLSHandshake: core.Exception.extend(function NotTLSHandshake() {
		NotTLSHandshake.parent.call(this, "not a TLS handshake packet");
	}),

	NotPresent: core.Exception.extend(function NotPresent() {
		NotPresent.parent.call(this, "SNI TLS extension not present");
	}),

	NameTypeUnknown: core.Exception.extend(function NameTypeUnknown() {
		NameTypeUnknown.parent.call(this, "SNI name type is unknown");
	}),

	parse: function(firstPacket)
	{
		if (firstPacket.readInt8(0) !== 22)
			throw SNI.NotTLSHandshake.create();

		var pos = 43; // fixed position
		pos += firstPacket[pos] + 1; // session ids
		pos += firstPacket.readInt16BE(pos) + 2; // ciphers
		pos += firstPacket[pos] + 1; // compression
		pos += 2; // extensions length

		var extension, length, nameType;

		while (pos < firstPacket.length)
		{
			extension = firstPacket.readInt16BE(pos);
			pos += 2;

			length = firstPacket.readInt16BE(pos);
			pos += 2;

			if (extension !== 0)
			{
				pos += length; // some other extension
			}
			else
			{
				nameType = firstPacket[pos];
				pos += 1;
				length -= 1;

				if (nameType !== 0)
					throw SNI.NameTypeUnknown.create();

				// not sure what the first four bytes are
				return firstPacket.toString('utf8', pos + 4, pos + length);
			}
		}

		throw SNI.NotPresent.create();
	}

};
