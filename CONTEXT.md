# Dearly

Dearly is a web app for creating personalized, interactive letters from curated templates and sharing them as link-based experiences.

## Language

### People and sharing

**Creator**:
An authenticated Dearly user who creates and manages Letters.
_Avoid_: Sender, account holder

**Letter ownership**:
Each Letter has one owning Creator. Only that Creator can edit or manage the Letter; Viewers and other Creators cannot collaborate on it.
_Avoid_: Shared ownership, collaboration

**Recipient**:
The person the Creator intends to receive a Letter. Being a Recipient does not grant exclusive access to the Letter.
_Avoid_: Viewer, when referring to the intended person

**Viewer**:
Any person who opens a Letter through its Share link. A Viewer does not need a Dearly account, and access is not restricted to the intended Recipient.
_Avoid_: Recipient, when referring to access rights

**Letter**:
A saved, personalized interactive experience created from one Template for an intended Recipient. In the first version, a Letter provides a one-way experience: Viewers can experience its content but do not submit replies or reactions. Future Templates may define response-capable Letter experiences.
_Avoid_: Post, page

**Share link**:
The unlisted URL used to open a Letter: anyone who possesses it can view the Letter, but the Letter is not discoverable through a public Dearly gallery or search. A QR code represents the same Share link rather than creating a separate version of the Letter.
_Avoid_: Public URL

**Scrollable story**:
The presentation style in which a Letter is experienced as one continuous vertical story made of a fixed ordered list of sections and Elements.
_Avoid_: Slide deck, page sequence

**Draft**:
A Letter that a Creator is still editing, is saved automatically as work progresses, and is not available through its Share link.
_Avoid_: Private Letter, unpublished page

**Published Letter**:
A Letter whose Share link is active. A Creator may continue editing it as a pending revision, and the changes appear at the same Share link only after the Creator explicitly publishes them.
_Avoid_: Final Letter, immutable version

**Pending revision**:
Changes to a Published Letter that are saved for the Creator but are not visible to Viewers until explicitly Published.
_Avoid_: Live draft, autosaved publication

**Archive**:
A Creator action that makes a Letter unavailable to all Viewers while keeping it under the Creator's management and available for restoration.
_Avoid_: Delete, unpublish

**Trash**:
A recoverable area for Letters removed by the Creator. A Letter in Trash is unavailable to Viewers until restored to its previous state or automatically permanently deleted after 90 days.
_Avoid_: Archive

**Draft preview**:
A private view of a Draft available only to its Creator before the Letter is Published.
_Avoid_: Share link

### Templates and content

**Category**:
An occasion-based grouping of Templates. Love Letter, Birthday Letter, and Anniversary Letter are Categories, and each Category contains multiple Templates.
_Avoid_: Type, genre

**Template**:
A reusable structure and design provided by Dearly for creating a Letter. A Template contains Elements and Fields that a Creator fills in, defines its own required or optional Fields, allowed Element types, and media limits, and may define its own opening screen.
_Avoid_: Theme, blank canvas

**Template snapshot**:
The Template structure and design captured by a Letter when it is created. Later Template changes do not alter existing Letters; updated Templates apply to new Letters.
_Avoid_: Live template, inherited template

**Template library**:
The Dearly-curated collection of Templates organized by Category. Creators choose from the library but do not create Templates in the first version. Future Templates may define how a Letter collects Viewer replies or reactions.
_Avoid_: Marketplace, user templates

**Element**:
A visible or interactive building block within a Template, such as a text section, photo gallery, click-to-reveal message, audio player, or animated effect.
_Avoid_: Field, component

**Opening screen**:
The Template-defined first view of a Letter. The Viewer opens the Scrollable story by taking an explicit action on this screen.
_Avoid_: Landing page, login screen

**Photo gallery**:
An Element whose photos are uploaded and ordered by the Creator while the Template controls their presentation and cropping.
_Avoid_: Image grid, album

**Reveal Element**:
An Element whose hidden content is supplied by the Creator and shown when the Viewer taps it.
_Avoid_: Popup, modal

**Audio Element**:
An optional Element containing one audio track that the Viewer starts and pauses with an explicit control.
_Avoid_: Playlist, background stream

**Media asset**:
A photo or audio file uploaded by a Creator for one Letter. Media assets are not shared across Letters in the first version and are not directly publicly listed.
_Avoid_: External media URL, shared media

**Animation**:
A Template-defined decorative visual effect that is not required for understanding a Letter.
_Avoid_: Creator animation, interaction

**Field**:
A value supplied by a Creator to personalize an Element, such as a text value, rich text, Recipient name, photo, photo gallery, or audio file. An Element may contain multiple Fields. An empty optional Field hides its related Element, while a missing required Field prevents publishing.
_Avoid_: Element, content block

**Link regeneration**:
A Creator action that disables a Letter's old Share link and creates a replacement unlisted link. Only the replacement link remains valid.
_Avoid_: Link duplication

**Viewer analytics**:
Aggregate information shown to a Creator about a Published Letter: total view count and the time it was last viewed. Dearly does not identify individual Viewers or record their interactions in the first version.
_Avoid_: Visitor tracking, engagement profile

**Letter report**:
A simple action through which a Viewer can notify Dearly about a Letter they believe should be reviewed.
_Avoid_: Viewer reply, reaction

**View**:
A successful opening of a Published Letter through its Share link. Creator previews do not count as Views.
_Avoid_: Unique visitor, preview

**Letter title**:
A private title supplied by the Creator to identify a Letter in the Creator dashboard. It is not automatically shown to Viewers; a Template may separately use the optional Recipient name in the Letter.
_Avoid_: Public title, Template name

**Dearly tone**:
The product's visual and emotional personality: warm, intimate, and elegant while remaining adaptable to romantic and non-romantic occasions.
_Avoid_: Strongly romantic, document editor

**Unavailable Letter page**:
The friendly Dearly response shown when a Viewer follows a Share link that has been archived, moved to Trash, permanently deleted, or otherwise disabled.
_Avoid_: Generic 404 page

**Creator dashboard**:
The authenticated area where a Creator manages Drafts and Published Letters, with Archived Letters and Trash kept in separate areas. It supports editing, archiving, and deleting the Creator's Letters.
_Avoid_: Admin panel, library
