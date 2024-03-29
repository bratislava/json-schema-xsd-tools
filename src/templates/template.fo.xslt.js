// eslint-disable-next-line no-secrets/no-secrets
export default `<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
        xml:lang="en"
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        xmlns:fo="http://www.w3.org/1999/XSL/Format"
        xmlns:z="http://schemas.gov.sk/form/{eformIdentifier}/{eformVersion}"
        version="1.0"
        xmlns:Xsl="http://www.w3.org/1999/XSL/Transform">

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

    </xsl:choose>
  </xsl:template>

  <!-- ########################## -->
  <!-- ALL templates below, prefixed with "base_", are format-specific and should not be modified. -->
  <!-- ########################## -->

  <xsl:template name="base_eform">
    <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
      <fo:layout-master-set>
        <fo:simple-page-master master-name="A4"
                               page-height="842px" page-width="595px"
                               margin-top="10px" margin-bottom="10px"
                               margin-left="10px" margin-right="10px">
          <fo:region-body margin-bottom="20mm"/>
          <fo:region-after region-name="footer" extent="10mm"/>
        </fo:simple-page-master>
        <fo:page-sequence-master master-name="document">
          <fo:repeatable-page-master-alternatives>
            <fo:conditional-page-master-reference master-reference="A4"/>
          </fo:repeatable-page-master-alternatives>
        </fo:page-sequence-master>
      </fo:layout-master-set>
      <fo:page-sequence master-reference="document" font-family="Arial">
        <fo:static-content flow-name="footer">
          <fo:block text-align="end"><fo:page-number/></fo:block>
        </fo:static-content>
        <fo:flow flow-name="xsl-region-body">
          <fo:block font-size='20pt' text-align='center'>
            <xsl:value-of select="z:Meta/z:Name" />
          </fo:block>
          <fo:block color='white'>|</fo:block>
          <fo:block/>

          <xsl:call-template name="body" />

          <fo:block font-size="12pt" text-align="left" margin-top="30px" margin-left="10px"
            margin-right="10px">
            Uložením a/alebo odoslaním Žiadosti výslovne vyhlasujem, že som sa oboznámil s podmienkami spracúvania osobných údajov Hlavného mesta ako prevádzkovateľa osobných údajov a beriem na vedomie, že ich spracúvanie je nevyhnutné na splnenie zákonných povinností Hlavného mesta v súvislosti s vybavením tejto žiadosti.
          </fo:block>

        </fo:flow>
      </fo:page-sequence>
    </fo:root>
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

  <xsl:template name="base_block">
    <xsl:param name="template_name" />
    <xsl:param name="values" />

    <fo:block margin-left="5mm">
      <xsl:call-template name="map">
        <xsl:with-param name="template" select="$template_name" />
        <xsl:with-param name="values" select="$values"/>
      </xsl:call-template>
    </fo:block>
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

    <fo:block margin-left="5mm" margin-top="2mm">
      <fo:block padding-left="2mm">
        <xsl:value-of select="$title" />
      </fo:block>
    </fo:block>
  </xsl:template>

  <xsl:template name="base_labeled_field">
    <xsl:param name="text" />
    <xsl:param name="node" />

    <fo:table space-before='2mm'>
      <fo:table-column/>
      <fo:table-column column-width='300px' />
      <fo:table-body>
        <fo:table-row>
          <fo:table-cell>
            <fo:block>
              <xsl:value-of select="$text" />
            </fo:block>
          </fo:table-cell>
          <xsl:choose>
            <xsl:when test="$node">
              <fo:table-cell border-width='0.6pt' border-style='solid' background-color='white' padding='1pt'>
                <fo:block>
                  <xsl:value-of select="$node" />
                  <fo:inline color='white'>___</fo:inline>
                </fo:block>
              </fo:table-cell>
            </xsl:when>
            <xsl:otherwise>
              <fo:table-cell>
                <fo:block></fo:block>
              </fo:table-cell>
            </xsl:otherwise>
          </xsl:choose>
        </fo:table-row>
      </fo:table-body>
    </fo:table>
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
