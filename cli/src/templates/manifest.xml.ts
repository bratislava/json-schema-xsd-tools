export default `<?xml version="1.0" encoding="utf-8"?>
<manifest:Manifest xmlns:attachment="urn:attachment:1.0"
    xmlns:attachmentfile="urn:attachmentfile:1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:setting="urn:setting:1.0" xmlns:meta="urn:meta:1.0" xmlns:content="urn:content:1.0"
    xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:presentation="urn:presentation:1.0"
    xmlns:data="urn:data:1.0" xmlns:manifest="urn:manifest:1.0">

    <manifest:file-entry media-type="application/xslt+xml" media-destination="sign"
        media-language="sk" full-path="Content\\form.sb.xslt"
        description="Xslt transformácia do txt pre zobrazenie pre podpisovač"
        filename="form.sb.xslt" />
    <manifest:file-entry media-type="application/xslt+xml" media-destination="print"
        media-language="sk" full-path="Content\\form.fo.xslt"
        description="Xsl fo transformácia. Slúži na použitie pri zobrazení do pdf"
        filename="form.fo.xslt" />

    <manifest:file-entry media-type="text/xml" media-destination="x-xsd-nat" media-language="sk"
        full-path="Content\\form.xsd" description="Xsd natívneho xml" filename="form.xsd" />
    <manifest:file-entry media-type="text/xml" media-language="sk" full-path="data.xml"
        description="eDoc (elektronický dokument) prázdne xml" filename="data.xml" />
    <manifest:file-entry media-type="application/xslt+xml" media-destination="view"
        media-language="sk" full-path="Content\\form.html.xslt"
        description="Xslt transformácia z eDoc xml do html" filename="form.html.xslt" />
    <manifest:file-entry media-type="text/xml" media-language="sk" full-path="schema.xsd"
        description="Xsd výsledného eDoc (elektronický dokument)  xml" filename="schema.xsd" />
    <manifest:file-entry media-type="text/xml" media-language="sk" full-path="meta.xml" />
    <manifest:file-entry media-type="text/xml" media-language="sk" full-path="attachments.xml" />
</manifest:Manifest>
`
