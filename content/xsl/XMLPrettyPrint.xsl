<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:html="http://www.w3.org/1999/xhtml"
  xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
  version="1.0">

  <xsl:output method="xml"/>

  <xsl:template match="/">
    <xsl:apply-templates/>
  </xsl:template>

  <xsl:template match="*">
    <html:div class="indent">
      <html:span class="markup">&lt;</html:span>
      <html:span class="start-tag"><xsl:value-of select="name(.)"/></html:span>
      <xsl:apply-templates select="@*"/>
      <html:span class="markup">/&gt;</html:span>
    </html:div>
  </xsl:template>

  <xsl:template match="*[node()]">
    <html:div class="indent">
      <html:span class="markup">&lt;</html:span>
      <html:span class="start-tag"><xsl:value-of select="name(.)"/></html:span>
      <xsl:apply-templates select="@*"/>
      <html:span class="markup">&gt;</html:span>

      <html:span class="text"><xsl:value-of select="."/></html:span>

      <html:span class="markup">&lt;/</html:span>
      <html:span class="end-tag"><xsl:value-of select="name(.)"/></html:span>
      <html:span class="markup">&gt;</html:span>
    </html:div>
  </xsl:template>

  <xsl:template match="*[* or processing-instruction() or comment() or string-length(.) &gt; 50]">
    <html:table>
      <html:tr>
        <xsl:call-template name="expander"/>
        <html:td>
          <html:span class="markup">&lt;</html:span>
          <html:span class="start-tag"><xsl:value-of select="name(.)"/></html:span>
          <xsl:apply-templates select="@*"/>
          <html:span class="markup">&gt;</html:span>

          <html:div class="expander-content"><xsl:apply-templates/></html:div>

          <html:span class="markup">&lt;/</html:span>
          <html:span class="end-tag"><xsl:value-of select="name(.)"/></html:span>
          <html:span class="markup">&gt;</html:span>
        </html:td>
      </html:tr>
    </html:table>
  </xsl:template>


  <xsl:template match="@*">
    <xsl:text> </xsl:text>
    <html:span class="attribute-name"><xsl:value-of select="name(.)"/></html:span>
    <html:span class="markup">=</html:span>
    <xsl:choose>
      <xsl:when test="name(.) = 'href'">
        "<xsl:element name="html:a">
          <xsl:attribute name="href">#</xsl:attribute>
          <xsl:attribute name="class">attribute-href</xsl:attribute>
          <xsl:attribute name="onclick">restclient.main.setRequestUrl('<xsl:value-of select="."/>');</xsl:attribute>
          <xsl:value-of select="."/>
        </xsl:element>"
      </xsl:when>
      <xsl:otherwise>
        <html:span class="attribute-value">"<xsl:value-of select="."/>"</html:span>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template match="text()">
    <xsl:if test="normalize-space(.)">
      <html:div class="indent text"><xsl:value-of select="."/></html:div>
    </xsl:if>
  </xsl:template>

  <xsl:template match="processing-instruction()">
    <html:div class="indent pi">
      <xsl:text>&lt;?</xsl:text>
      <xsl:value-of select="name(.)"/>
      <xsl:text> </xsl:text>
      <xsl:value-of select="."/>
      <xsl:text>?&gt;</xsl:text>
    </html:div>
  </xsl:template>

  <xsl:template match="processing-instruction()[string-length(.) &gt; 50]">
    <html:table>
      <html:tr>
        <xsl:call-template name="expander"/>
        <html:td class="pi">
          &lt;?<xsl:value-of select="name(.)"/>
          <html:div class="indent expander-content"><xsl:value-of select="."/></html:div>
          <xsl:text>?&gt;</xsl:text>
        </html:td>
      </html:tr>
    </html:table>
  </xsl:template>

  <xsl:template match="comment()">
    <html:div class="comment indent">
      <xsl:text>&lt;!--</xsl:text>
      <xsl:value-of select="."/>
      <xsl:text>--&gt;</xsl:text>
    </html:div>
  </xsl:template>

  <xsl:template match="comment()[string-length(.) &gt; 50]">
    <html:table>
      <html:tr>
        <xsl:call-template name="expander"/>
        <html:td class="comment">
          <xsl:text>&lt;!--</xsl:text>
          <html:div class="indent expander-content"><xsl:value-of select="."/></html:div>
          <xsl:text>--&gt;</xsl:text>
        </html:td>
      </html:tr>
    </html:table>
  </xsl:template>
  
  <xsl:template name="expander">
    <html:td class="expander">&#x2212;<html:div class="spacer"/></html:td>
  </xsl:template>
  
</xsl:stylesheet>
