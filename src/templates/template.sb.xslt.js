// eslint-disable-next-line no-secrets/no-secrets
export default `<?xml version="1.0" encoding="utf-8" standalone="yes"?>

<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:z="http://schemas.gov.sk/form/{eformIdentifier}/{eformVersion}">
  <xsl:output method="text" encoding="utf-8" indent="no" />
  <xsl:preserve-space elements="*" />

  <xsl:template match="/z:E-form">
    <xsl:call-template name="base_eform" />
  </xsl:template>

  <!-- this is the template which gets called inside the FO structure -->
  <xsl:template name="body">

  </xsl:template>

  <!-- XSL cannot dynamically "yield" template, so here is simple mapping for each template based on name -->
  <!-- TODO better way to do this? -->
  <xsl:template name="map">
    <xsl:param name="template"/>
    <xsl:param name="values" />

    <xsl:choose>

    </choose>
  </xsl:template>

  <!-- ########################## -->
  <!-- ALL templates below, prefixed with "base_", are format-specific and should not be modified. -->
  <!-- ########################## -->

  <xsl:template name="base_eform">
    <xsl:value-of select="concat(z:Meta/z:Name, '&#10;')" />
    <xsl:call-template name="body" />
  </xsl:template>

  <xsl:template name="base_block_with_title">
    <xsl:param name="template_name" />
    <xsl:param name="values" />
    <xsl:param name="title" />

    <xsl:if test="$title">
      <xsl:call-template name="base_title">
        <xsl:with-param name="title" select="$title" />
      </xsl:call-template>
    </xsl:if>

    <xsl:call-template name="base_block">
      <xsl:with-param name="template_name" select="$template_name" />
      <xsl:with-param name="values" select="$values" />
    </xsl:call-template>
  </xsl:template>

  <!-- todo you cannot actually wrap text inside block, so the spacing is off in the result -->
  <xsl:template name="base_block">
    <xsl:param name="template_name" />
    <xsl:param name="values" />

    <xsl:call-template name="map">
      <xsl:with-param name="template" select="$template_name" />
      <xsl:with-param name="values" select="$values"/>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="base_format_telefonne_cislo">
    <xsl:param name="node" />

    <xsl:value-of select="concat($node/*[local-name() = 'MedzinarodneVolacieCislo'], ' ')" />
    <xsl:value-of select="concat($node/*[local-name() = 'Predvolba'], ' ')" />
    <xsl:value-of select="$node/*[local-name() = 'Cislo']" />
  </xsl:template>

  <xsl:template name="base_boolean">
    <xsl:param name="bool" />

    <xsl:choose>
      <xsl:when test="$bool = 'true'">
        <xsl:text>Áno</xsl:text>
      </xsl:when>
      <xsl:when test="$bool = 'false'">
        <xsl:text>Nie</xsl:text>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="base_format_date">
    <xsl:param name="instr"/>
    <!-- YYYY-MM-DD -->
    <xsl:variable name="yyyy">
      <xsl:value-of select="substring($instr,1,4)"/>
    </xsl:variable>
    <xsl:variable name="mm">
      <xsl:value-of select="substring($instr,6,2)"/>
    </xsl:variable>
    <xsl:variable name="dd">
      <xsl:value-of select="substring($instr,9,2)"/>
    </xsl:variable>

    <xsl:value-of select="concat($dd,'.',$mm,'.',$yyyy)"/>
  </xsl:template>

  <!-- <xsl:template name="base_format_time">
    <xsl:param name="instr"/>
    <xsl:value-of select="format-time($instr, '[H01]:[m01]')"/>
  </xsl:template> -->

  <xsl:template name="base_format_datetime">
    <xsl:param name="dateTime"/>
    <xsl:variable name="dateTimeString" select="string($dateTime)"/>
    <xsl:choose>
      <xsl:when
              test="$dateTimeString!= '' and string-length($dateTimeString)>18 and string(number(substring($dateTimeString, 1, 4))) != 'NaN' ">
        <xsl:value-of
                select="concat(substring($dateTimeString, 9, 2), '.', substring($dateTimeString, 6, 2), '.', substring($dateTimeString, 1, 4),' ', substring($dateTimeString, 12, 2),':', substring($dateTimeString, 15, 2))"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$dateTimeString"></xsl:value-of>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="base_title">
    <xsl:param name="title" />
    <xsl:value-of select="concat($title, '&#10;')" />
  </xsl:template>

  <xsl:template name="base_labeled_field">
    <xsl:param name="text" />
    <xsl:param name="node" />
    <xsl:choose>
      <xsl:when test="$node">
        <xsl:value-of select="concat('&#09;', $text, ': ', $node, '&#10;')" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="concat('&#09;', $text, '&#10;')" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="base_labeled_textarea">
    <xsl:param name="text" />
    <xsl:param name="node" />

    <xsl:call-template name="base_labeled_field">
      <xsl:with-param name="text" select="$text" />
      <xsl:with-param name="node" select="$node" />
    </xsl:call-template>
  </xsl:template>
</xsl:stylesheet>`
