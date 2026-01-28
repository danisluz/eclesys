package com.eclesys.api.features.tenants.service;

import com.eclesys.api.features.tenants.entity.TenantEntity;
import com.eclesys.api.features.tenants.repository.TenantRepository;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantLogoService {

  private static final int MAX_WIDTH = 512;
  private static final int MAX_HEIGHT = 512;
  private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

  private final TenantRepository tenantRepository;
  private final Path basePath;

  public TenantLogoService(
      TenantRepository tenantRepository,
      @Value("${eclesys.storage.tenant-logos-path:./storage/tenant-logos}") String basePath
  ) {
    this.tenantRepository = tenantRepository;
    this.basePath = Path.of(basePath).toAbsolutePath().normalize();
  }

  public String uploadLogo(UUID tenantId, MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("Logo é obrigatório");
    }
    if (file.getSize() > MAX_FILE_SIZE_BYTES) {
      throw new IllegalArgumentException("Logo excede o tamanho máximo de 5MB");
    }

    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    BufferedImage source = readImage(file);
    BufferedImage resized = resizeImage(source, MAX_WIDTH, MAX_HEIGHT);
    byte[] pngBytes = toPngBytes(resized);

    try {
      Files.createDirectories(basePath);
      Path target = logoPath(tenant.getId());
      writeAtomically(target, pngBytes);
    } catch (IOException ex) {
      throw new IllegalStateException("Falha ao salvar o logo");
    }

    tenant.setLogoUrl(buildPublicLogoUrl(tenant.getTenantCode()));
    tenant.setUpdatedAt(Instant.now());
    tenantRepository.save(tenant);

    return buildVersionedLogoUrl(tenant);
  }

  public void removeLogo(UUID tenantId) {
    TenantEntity tenant = tenantRepository.findById(tenantId)
        .orElseThrow(() -> new RuntimeException("Tenant não encontrado"));

    Path path = logoPath(tenant.getId());
    try {
      Files.deleteIfExists(path);
    } catch (IOException ex) {
      throw new IllegalStateException("Falha ao remover o logo");
    }

    tenant.setLogoUrl(null);
    tenant.setUpdatedAt(Instant.now());
    tenantRepository.save(tenant);
  }

  public Path loadLogoPath(String tenantCode) {
    String normalizedCode = normalizeTenantCode(tenantCode);
    TenantEntity tenant = tenantRepository.findByTenantCode(normalizedCode)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    if (tenant.getLogoUrl() == null || tenant.getLogoUrl().isBlank()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    Path path = logoPath(tenant.getId());
    if (!Files.exists(path)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    return path;
  }

  public String buildVersionedLogoUrl(TenantEntity tenant) {
    if (tenant.getLogoUrl() == null || tenant.getLogoUrl().isBlank()) {
      return null;
    }
    long version = tenant.getUpdatedAt() != null ? tenant.getUpdatedAt().toEpochMilli() : System.currentTimeMillis();
    String separator = tenant.getLogoUrl().contains("?") ? "&" : "?";
    return tenant.getLogoUrl() + separator + "v=" + version;
  }

  private Path logoPath(UUID tenantId) {
    return basePath.resolve(tenantId + ".png");
  }

  private BufferedImage readImage(MultipartFile file) {
    try (InputStream inputStream = file.getInputStream()) {
      ImageIO.setUseCache(false);
      BufferedImage image = ImageIO.read(inputStream);
      if (image == null) {
        throw new IllegalArgumentException("Arquivo não é uma imagem válida");
      }
      return image;
    } catch (IOException ex) {
      throw new IllegalArgumentException("Arquivo não é uma imagem válida");
    }
  }

  private BufferedImage resizeImage(BufferedImage original, int maxWidth, int maxHeight) {
    int width = original.getWidth();
    int height = original.getHeight();

    double scale = Math.min(1.0, (double) maxWidth / width);
    if (height * scale > maxHeight) {
      scale = Math.min(scale, (double) maxHeight / height);
    }

    int targetWidth = (int) Math.round(width * scale);
    int targetHeight = (int) Math.round(height * scale);

    if (targetWidth == width && targetHeight == height) {
      return original;
    }

    BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
    Graphics2D graphics = resized.createGraphics();
    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
    graphics.drawImage(original, 0, 0, targetWidth, targetHeight, null);
    graphics.dispose();
    return resized;
  }

  private byte[] toPngBytes(BufferedImage image) {
    try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
      ImageWriter writer = getPngWriter();
      if (writer == null) {
        ImageIO.write(image, "png", outputStream);
        return outputStream.toByteArray();
      }

      ImageWriteParam param = writer.getDefaultWriteParam();
      if (param.canWriteCompressed()) {
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(0.8f);
      }

      try (ImageOutputStream imageOutput = ImageIO.createImageOutputStream(outputStream)) {
        writer.setOutput(imageOutput);
        writer.write(null, new IIOImage(image, null, null), param);
      } finally {
        writer.dispose();
      }

      return outputStream.toByteArray();
    } catch (IOException ex) {
      throw new IllegalStateException("Falha ao processar o logo");
    }
  }

  private ImageWriter getPngWriter() {
    Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("png");
    return writers.hasNext() ? writers.next() : null;
  }

  private void writeAtomically(Path target, byte[] bytes) throws IOException {
    Path tempFile = Files.createTempFile(basePath, "tenant-logo-", ".tmp");
    Files.write(tempFile, bytes);
    try {
      Files.move(tempFile, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    } catch (IOException ex) {
      Files.move(tempFile, target, StandardCopyOption.REPLACE_EXISTING);
    }
  }

  private String buildPublicLogoUrl(String tenantCode) {
    return "/api/public/tenants/" + tenantCode + "/logo";
  }

  private String normalizeTenantCode(String tenantCode) {
    return tenantCode == null ? "" : tenantCode.trim().toLowerCase(Locale.ROOT);
  }
}
