import { onchainTable, relations } from "ponder";
import type { Address } from "viem";

export const domains = onchainTable("domains", (t) => ({
	// The namehash of the name
	id: t.hex().primaryKey(),
	// The human readable name, if known. Unknown portions replaced with hash in square brackets (eg, foo.[1234].eth)
	name: t.text(),
	// The human readable label name (imported from CSV), if known
	labelName: t.text("label_name"),
	// keccak256(labelName)
	labelhash: t.hex(),
	// The namehash (id) of the parent name
	parentId: t.hex(), // TODO: relationship has one domain

	// The number of subdomains
	subdomainCount: t.integer("subdomain_count").notNull().default(0),

	// Address logged from current resolver, if any
	// TODO: implement resolvedAddress by going through resolverId -> addr

	// The resolver that controls the domain's settings
	resolverId: t.text(),

	// The time-to-live (TTL) value of the domain's records
	ttl: t.bigint(),

	// Indicates whether the domain has been migrated to a new registrar
	isMigrated: t.boolean("is_migrated").notNull().default(false),
	// The time when the domain was created
	createdAt: t.bigint("created_at").notNull(),

	// The account that owns the domain
	ownerId: t.hex("owner_id").notNull(),
	// The account that owns the ERC721 NFT for the domain
	// TODO: has one Account
	registrantId: t.hex("registrant_id"),
	// The account that owns the wrapped domain
	// TODO: has one Account
	wrappedOwnerId: t.hex("wrapped_owner_id"),

	// The expiry date for the domain, from either the registration, or the wrapped domain if PCC is burned
	expiryDate: t.bigint(),

	// The registration associated with the domain
	// registration: Registration @derivedFrom(field: "domain")

	// "The wrapped domain associated with the domain"
	// wrappedDomain: WrappedDomain @derivedFrom(field: "domain")

	// "The events associated with the domain"
	// events: [DomainEvent!]! @derivedFrom(field: "domain")
}));

export const domainRelations = relations(domains, ({ one, many }) => ({
	// has one owner
	owner: one(accounts, {
		fields: [domains.ownerId],
		references: [accounts.id],
	}),
	parent: one(domains, {
		fields: [domains.parentId],
		references: [domains.id],
	}),
	resolver: one(resolvers, {
		fields: [domains.resolverId],
		references: [resolvers.id],
	}),
	subdomains: many(domains, { relationName: "parent" }),
}));

export const accounts = onchainTable("accounts", (t) => ({
	id: t.hex().primaryKey(),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
	// account has many domains
	domains: many(domains),
	// TODO: has many wrapped domains
	// TODO: has many registrations
}));

export const resolvers = onchainTable("resolvers", (t) => ({
	// The unique identifier for this resolver, which is a concatenation of the domain namehash and the resolver address
	id: t.text().primaryKey(),
	// The domain that this resolver is associated with
	domainId: t.hex("domain_id").notNull(),
	// The address of the resolver contract
	address: t.hex().notNull().$type<Address>(),

	// The current value of the 'addr' record for this resolver, as determined by the associated events
	addrId: t.hex("addr_id"),
	// The content hash for this resolver, in binary format
	contentHash: t.text("content_hash"),
	// The set of observed text record keys for this resolver
	texts: t.text().array().notNull().default([]),
	// The set of observed SLIP-44 coin types for this resolver
	coinTypes: t.bigint("coin_types").array().notNull().default([]),

	// TODO: has many events
}));

export const resolverRelations = relations(resolvers, ({ one }) => ({
	addr: one(accounts, {
		fields: [resolvers.addrId],
		references: [accounts.id],
	}),
	domain: one(domains, {
		fields: [resolvers.domainId],
		references: [domains.id],
	}),
}));
